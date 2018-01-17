
// here initializes the slide panel and the callbacks in it 
$(document).ready(function(){
    $('#side_panel').BootSideMenu({side:"right"});
    $('#get_next').prop('disabled', true);
    $('#get_all').prop('disabled', true);

    var params = parse_url_params();
    console.log("params", params);
    //for test purpose we use dropbox authentication 
    if (params['dropbox'] && params['dropbox'] == 'true'){
        // initializes credentials using dropbox
        ini_credentials({dropbox:true});
    }
    else if ( params['user'] ){
        console.log("initializing basic auth credentials");
        var passwd = params['password'];
        if (passwd == undefined){
            console.log("warning no password information");
            passwd= "pass";
        }
        ini_credentials({
            basic_auth : true,
            user: params.user,
            password : passwd
        });
        $('<ul class="nav navbar-nav navbar-right">\
                <li><a>Hello ' + params['user'].capitalize() + '!</a></li> \
            </ul>'
         ).appendTo('.navbar-collapse');
    }

    $('#list_schemas').on('click', function(e){ list_schemas()});

    $("[rel=tooltip]").tooltip({ placement: 'right'});
    //download results
    $('#download_results').on('click', function(e){
        //downloadJsonObj(queryResults, "data.json");
        $("#download_dialog").modal('show');
        document.getElementById('download_json').onclick = function () {
            downloadObj( queryResults, "results.json", "json");
            $("#download_dialog").modal('hide');
        };
        document.getElementById('download_csv').onclick = function () {
            downloadObj( queryResults, "results.csv", "csv");
            $("#download_dialog").modal('hide');
        };
        document.getElementById('download_excel').onclick = function () { };
    });

    $("#add_data").on("click", function(e){ 
        $("#register_url_dialog").modal('show');
    });
    $("#register_url_dialog .btn-success").on( "click",  function(e){
        var url = $("#url_text").val();
        var name = $("#url_name").val();
        var type = $("#url_type").val();
        add_from_url(url, name, type);
        //closes the dialog
        $("#register_url_dialog").modal('hide');
    });

    var editor = ace.edit("editor");
    editor.setTheme("ace/theme/ambiance");
    editor.getSession().setMode("ace/mode/sql");
    editor.$blockScrolling = Infinity;
    editor.setOptions({
        enableBasicAutocompletion: true,
        enableSnippets: true,
        enableLiveAutocompletion: true
    });
    //Syntax checker in ace uses same setAnnotations api, and clears old anotations.
    // check http://stackoverflow.com/questions/25903709/ace-editors-setannotations-wont-stay-permanent
    editor.session.setOption("useWorker", false);
    editor.session.setUseWrapMode(true);

    var container = document.getElementById("json_editor");
    var options = { mode: 'view' };
    console.log("container", container);
    var jsonEditor = new JSONEditor(container, options);

    function editor_set_autoexecute(b) {
        var btn = document.getElementById('execute_btn');
        if (b) {
            btn.style.visibility = 'hidden';
            editor.getSession().on('change', function(e) { 
                if (document.getElementById("auto_query").checked){
                    removeAllErrors(editor);
                    post_query(editor, jsonEditor);
                }
            });
        } else {
            editor.getSession().on('change', function(e) {});
            btn.style.visibility = 'visible';
        }
    }

    editor_set_autoexecute(true);

    document.getElementById('execute_btn').onclick = function() {
        console.log("editor", editor);
        post_query(editor, jsonEditor);
    };

    document.getElementById('auto_query').onchange = function() {
        if (document.getElementById("auto_query").checked){
            editor_set_autoexecute(true);
        }
        else{
            editor_set_autoexecute(false);
        }
    }

    // starts listing the schemas
    list_schemas();
    //for test purpose we use dropbox authentication 
    if (params['sniff'] && params['sniff'] == 'true') {
        // Will periodically check the sniff server for new info
        setInterval(refresh_info, 3000);
    }
});

function refresh_info() {
    http_json_request("GET", "/sniff/last_status", undefined, {
        success: function(data){
            var status = data.status;
            if (status.length > 0) console.log("got new data", status);
            for (var n = 0 ; n <  status.length ; n++){
                msg =  status[n].msg
				switch( data.status[n].type){
					case 'error':
						append_alert(msg, 'alert-danger')
						break; 
					case 'response-error':
					    msg = '<p>' + msg.msg + '</p>'+ msg.response.message ;
					    console.log("response-error", msg);
						append_alert(msg, 'alert-danger')
						break; 
					case 'warning':
						append_alert(msg, 'alert-warning')
							break;
						append_alert(msg, 'alert-danger')
							break;
					case 'success':
						append_alert(msg, 'alert-success')
							break;
					case 'info':
						append_alert(msg, 'alert-info')
							break;
				}
            }
            $('.alert').stop().fadeOut(5000);
            $("#alerts").empty();
            list_schemas();
        },
        error: function(request, status, error){
            append_error(error);
            console.log(error);
            $('.alert').stop().fadeOut(5000);
        }
    })
}
