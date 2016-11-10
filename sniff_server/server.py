#!/usr/bin/env python

from flask import Flask, request, jsonify, Response, send_from_directory, send_file
import os
import threading
from argparse import ArgumentParser, FileType
import collections
import requests
import logging
import json
import datetime
from sniff import sniff
import psycopg2

lock = threading.Lock()
# deque is like a circular buffer (we will keep the last 100 messages)
info = collections.deque(maxlen=100)
last_info = collections.deque(maxlen=100)

user = ''

logging.basicConfig(level=logging.DEBUG)

def append_msg(msg_type, msg):
    info.append(dict(type=msg_type,msg=msg,date=datetime.datetime.now()))
    last_info.append(dict(type=msg_type,msg=msg,date=datetime.datetime.now()))

def registerfile(path):
    # extracts name and type from the filename 
    pass

def on_start(files, do_reload=True):
    for f in files:
        registerfile(f)

def on_create(f, do_reload=True):
    registerfile(f)
  
def on_modified(f):
    append_msg("warning", "File changed detected, registering again %s" % f)
    registerfile(f)

def on_delete(f):
    # Do nothing on delete.
    # The alternative would have been to reload again all other data.
    append_msg("warning","File delete but feature not implemented yet %s" % f)
    
def background_loader(do_reload=True, folder="data"):
    print "folder=%s , reload = %s " %(folder, reload)
    sniff(folder=folder, lock=lock, interval=1,
        on_start=on_start, on_create=on_create, on_modified=on_modified,
        on_delete=on_delete, do_reload=do_reload)

def format_cursor(cur):
    # Transforms the results of a cursor into list of dicts
    out = []
    colnames = [desc[0] for desc in cur.description]
    for row in cur.fetchall():
        d = dict()
        for i, name in enumerate(colnames):
            d[name] = row[i]
        out.append(d)
    return out

app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False

@app.route('/status', methods=['GET'])
def status():
    return jsonify(dict(status=list(info)))

@app.route('/last_status', methods=['GET'])
def last_status():
    l = list(last_info)
    last_info.clear()
    return jsonify(dict(status=l))

@app.route('/query-start', methods=['POST'])
def query_start():
    data = json.loads(request.data)
    cur = conn.cursor()
    try:
        cur.execute(data["query"])
    except psycopg2.Error as e:
        logging.error("error:", e)
        conn.rollback()
        raise
    conn.commit()
    data = format_cursor(cur)
    return jsonify(dict(data=data))

@app.route('/file/<path:filename>', methods=['GET'])
def static_file(filename):
    return send_from_directory("../static", filename)

@app.route('/schemas', methods=['GET'])
def schemas():
    cur = conn.cursor()
    query = """SELECT table_name
                FROM information_schema.tables
                WHERE table_schema != 'pg_catalog'
                AND table_schema != 'information_schema' """
    cur.execute(query)
    return jsonify(dict(schemas=cur.fetchall()))

if __name__ == '__main__':
    argp = ArgumentParser(description="Raw sniff server")
    argp.add_argument( "--reload","-r", action="store_true", default=False,
            help="reloads the file if a change was detected")
    argp.add_argument("--folder", "-f", default="data", metavar="FOLDER",
            help="Folder to be sniffed for changes")
    argp.add_argument("--host", "-H", default="localhost",
                      help="hostname of NoDB server")
    argp.add_argument("--user", "-u", default="postgres",
            help="user name to register files")
    argp.add_argument("--dbname", "-d", default="postgres",
                      help="database name")
    argp.add_argument("--password", "-p", default="1234",
                      help="password to connect")

    args = argp.parse_args()
    user = args.user
    thread = threading.Thread(target=background_loader,
                  args=(args.reload,args.folder, ))
    thread.setDaemon(True)
    thread.start()
    global conn
    conn = psycopg2.connect(database=args.dbname,
                            user=args.user,
                            host=args.host,
                            password=args.password)
    app.run(host='0.0.0.0', port=5555)