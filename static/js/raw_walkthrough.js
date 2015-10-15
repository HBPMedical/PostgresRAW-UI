// TODO auto_query should be reset and execute button should enable/disable
// too.

var editor;
var editor_bytes;
var auto_query = null;
var comments;
var idx;
var animation_ongoing = null;

function demo_init(aceEditor) {
    editor = aceEditor;
    $('#prev').click(demo_prev);
    $('#next').click(demo_next);
    demo_stop();
}

function demo_start() {
    // save auto_query setting for later
    auto_query = $("#auto_query").attr('checked');
    $("#auto_query").prop('checked', false);
    $('#demo_mode').addClass("active");
    $('#demoBox').css('height', '150px');
    $('#demoBox').css('line-height', '150px');
    $('#editor').css('height', '550px');
    $('#demoNavigation').css('visibility', 'visible');
    $('#demo_mode').click(demo_stop);
    comments = $("#demoComments");
    demo_editor_reset("");
    idx = -1;
    demo_next();
}

function demo_stop() {
    // reset auto query
    if (auto_query) {
        $("#auto_query").prop('checked', auto_query);
    }
    $('#demo_mode').click(demo_start);
    $('#demoBox').height(0);
    $('#demoComments').empty();
    $('#editor').height(700);
    $('#demo_mode').removeClass("active");
    $('#demoNavigation').css('visibility', 'hidden');
}


function demo_editor_reset(content) {
    editor.setValue(content);
    editor.navigateFileEnd();
    editor.updateSelectionMarkers();
    editor_bytes = content.split("");
}

function demo_next() {
    editor.focus();
    // disable animation if it is going on
    if (animation_ongoing) {
        todos = [];
        return;
    }
    // reset the editor with the current step query
    if (idx == -1 || !steps[idx].expected)
        demo_editor_reset("");
    else
        demo_editor_reset(steps[idx].expected);
    // start animation of next query
    idx++;
    if (steps[idx].edits) {
        animate(steps[idx].edits);
    }
    else
        demo_comments(steps[idx].doc);
}

function demo_prev() {
}


// string processing for animation

function demo_autotype_insert(where, s) {
    var i = 0;
    var todo = [];
    for (i=0; i<s.length; i++) {
        todo.push({'action':'insert', 'where': where+i, 'what':s[i]});
    }
    return todo;
}

function demo_autotype_suppr(where, n) {
    var i = 0;
    var todo = [];
    for (i=0; i<n; i++) {
        todo.push({'action':'suppr', 'where': where});
    }
    return todo;
}

// given a list of edits to perform, split each one into single
// character operations (that part is done here in javascript) and
// build a datastructure to hold each single step (called 'todos') and
// then start the animation.

var todos = [];
function animate(edits) {
    for (i=0; i<edits.length;i++) {
        if (edits[i].action == "insert")
            todos = todos.concat(demo_autotype_insert(edits[i].where, edits[i].what));
        else if (edits[i].action == "suppr")
            todos = todos.concat(demo_autotype_suppr(edits[i].where, edits[i].what));
        todos.push({"action": "pause"});
    }
    var i;
    var index;
    function _cb() {
        var sleep = 50;
        // if animation was interrupted, return (typing stops)
        if (!animation_ongoing) return;
        // else perform next type
        todo = todos.shift();
        if (todo != undefined) {
            // some typing to do
            if (todo["action"] == "insert") {
                editor_bytes.splice(todo["where"], 0, todo["what"]);
                index = todo["where"]+1;
            } else if (todo["action"] == "suppr") {
                editor_bytes.splice(todo["where"], 1);
                index = todo["where"];
            } else if (todo["action"] == "pause") {
                sleep = 300;
            }
            // print on the editor and move cursor to 'index'
            editor.setValue(editor_bytes.join(""), index);
            // we have to do this to avoid some area to be selected
            editor.moveCursorToPosition(editor_cursor_pos(index));
            editor.updateSelectionMarkers();
            // schedule another call for continuing typing
            setTimeout(_cb, sleep);
        } else {
            // typing finished, update screen in case there was
            // a mess and print comments.
            demo_editor_reset(steps[idx].expected);
            demo_comments(steps[idx].doc);
            animation_ongoing = false;
        }
    }
    animation_ongoing = true;
    _cb();
}

function editor_cursor_pos(index) {
    var x = 0;
    var y = 0;
    var i;
    for (i=0; i<index; i++) {
        if (editor_bytes[i] == '\n') { y++; x=0; }
        else x++;
    }
    return {"column":x, "row":y}
}

function demo_comments(content) {
  $("#demoComments").fadeOut(function () {
    $("#demoComments").text(content).fadeIn(600);
  });
}

/*
function demo_comments(content) {
  $("#demoComments").fadeOut().next().text(content).fadeIn();
}
*/
function demo_clear_comments() {
  $("#demoComments").finish().empty().fadeOut();
}

