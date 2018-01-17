// the div used in all the drawing functions
var graph_div =document.getElementById('graph');

// global variable that holds the data to be plotted
var draw_data = {
    data: undefined,
    last_draw : "json_editor"
}

$(document).ready(function(){
    //graph_div =$('#graph')[0];
    // assigns the callbacks to all the elements
    $('#draw_table').on('click', function (e){ draw_graph('table',e)});
    // 2d graphs
    $('#draw_pie').on('click', function (e){ draw_graph('pieChart',e)});
    $('#draw_bar').on('click', function (e){
        console.log("drawing barchart");
        draw_graph('barChart', e);
     });
    $('#draw_line').on('click', function (e){ draw_graph('line_chart',e)});
    //geo graphs
    // hierarchy graphs
    $('#draw_sunburst').on('click', function (e){ draw_graph('sunburts',e)});
    $('#draw_tree').on('click', function (e){ draw_graph('tree',e)});
    $('#draw_circle_pack').on('click', function (e){ draw_graph('circle_pack',e)});
    $('#draw_treemap').on('click', function (e){ draw_graph('treemap',e)});
    $('#draw_bubblechart').on('click', function (e){ draw_graph('bubble_chart',e)});
    //3D grpahs
    $('#draw_3dsurface').on('click', function (e){ draw_graph('surface_3d',e)});
    $('#draw_3dbars').on('click', function (e){ draw_graph('bars_3d',e)});
    $('#draw_heatmap').on('click', function (e){ draw_graph('heatmap',e)});
    $('#values_li').on('click', function(e){
        draw_data.last_draw = "json_editor";
    });
    
});

// loads the forms
$('#forms-container').load('forms.html #forms');

var graph_colors = ['rgb(127, 127, 255)', 'rgb(255, 127, 127)', 'rgb(127, 255, 127)', 'rgb(198, 99, 198)', 'rgb(99, 99, 99)']

//data structure with functions to visualize the data
var draw_functions  = {
    table : function(){
        var table = arrayToTable(draw_data.data)
        console.log(table)
        graph_div.innerHTML = table;
    },
    barChart : function(){ 
        var data = arrayToDataset(draw_data.data, false);
        console.log("dataset", data)
        graph_div.innerHTML = '<canvas id="chartjs" style="height: 100%; width: 100%;"></canvas>';
        var ctx = document.getElementById('chartjs').getContext('2d');
        new Chart(ctx, {
            type: 'bar', data: data, options: {}
        });
    },    
    pieChart : function(){ 
        var data = arrayToDataset(draw_data.data, true);
        console.log("dataset", data)
        graph_div.innerHTML = '<canvas id="chartjs" style="height: 100%; width: 100%;"></canvas>';
        var ctx = document.getElementById('chartjs').getContext('2d');
        new Chart(ctx, {
            type: 'pie', data: data, options: {}
        });
    },
    line_chart: function(){
        var data = arrayToDataset(draw_data.data);
        console.log("dataset", data)
        graph_div.innerHTML = '<canvas id="chartjs" style="height: 100%; width: 100%;"></canvas>';
        var ctx = document.getElementById('chartjs').getContext('2d');
        new Chart(ctx, {
            type: 'line', data: data, options: {}
        });
    },
    sunburts: function(){
        d = dataToHierarchy(draw_data.data);
        draw_sunburst(d, graph_div);
    },
    tree: function(){
        correct_enabled_tab(draw_data.last_draw);
        d = dataToHierarchy(draw_data.data);
        draw_tree(d, graph_div);
    },
    circle_pack: function(){
        d = dataToHierarchy(draw_data.data);
        draw_circle_packing(d, graph_div);
    },
    treemap: function(){
        d = dataToHierarchy(draw_data.data);
        draw_treemap(d, graph_div);
    },
    bubble_chart: function(){
        d = dataToHierarchy(draw_data.data);
        draw_bubblechart(d, graph_div);
    },
    surface_3d : function(){

        var t = dataToPointTable(draw_data.data);
        var options = { 
            style: "surface",
            width: ""+graph_div.offsetWidth -10+ "px",
            height: ""+graph_div.offsetHeight -10+ "px"
        };
        var chart = new links.Graph3d(graph_div);
        chart.draw(t, options);
    },
    bars_3d : function(){
        var t = dataToPointTable(draw_data.data);
        var options = { 
            style: "bar",
            width: ""+graph_div.offsetWidth -10+ "px",
            height: ""+graph_div.offsetHeight -10+ "px"
        };
        var chart = new links.Graph3d(graph_div);
        chart.draw(t, options);
    },
    heatmap : function(){
        correct_enabled_tab(draw_data.last_draw);
        d = dataToMatrix(draw_data.data);
        //["#f00", "#f80", "#ff0", "#fff", "#002"]
        //["#002","#fff" ,"#ff0", "#fa0", "#f00"]
        //["#0a0", "#6c0", "#ee0", "#eb4", "#eb9", "#fff"]
        draw_heatmap(d, graph_div, {colors :["#002","#88f","#4f4","#ff4","#f80" ,"#f00"]});
    }
}


// function that redraws the graph
function redraw_graph(new_data){
	draw_data.data=new_data;
    check_compatible_graphs(new_data);
	if (draw_data.last_draw == "json_editor" ) return;

	if (draw_data.last_draw != ""){
		console.log("redrawing " + draw_data.last_draw);
		draw_graph(draw_data.last_draw);
	}
	else{
		console.log("last_draw empty");
	}

}
// returns the current selected graph (for saving queries)
function get_selected_graph(){
    return draw_data.last_draw;
}

// sets the current selecte graph (for loading queries)
function set_selected_graph(graph){
    draw_data.last_draw = graph;

    if (graph == 'json_editor'){
        console.log('enabling values tab')
        $('#vis_tab a[href="#values"]').tab('show');

    }
    else{
        $('#vis_tab a[href="#graph_tab"]').tab('show');
    }
}

// checks if all keys are numeric starting from <start>
// This is useful to check the compatibility of certain graphs
function all_numeric(data, start){
    var types = [];
    for (var k in data){
        types.push(getType(data[k]))
    }
    for (var n = start; n < types.length ; n++){
        if (types[n] != "number") return false;
    }
    return true;
}

// disables all graphs that are incompatible with the current data.
function check_compatible_graphs(data){
    var enable = function(enabled ) {
        elements = ['draw_table',
                    'draw_pie',
                    'draw_bar',
                    'draw_line',
                    'draw_sunburst',
                    'draw_tree',
                    'draw_circle_pack',
                    'draw_treemap',
                    'draw_bubblechart',
                    'draw_3dsurface',
                    'draw_3dbars',
                    'draw_heatmap',
                    '2d_dropdown',
                    '3d_dropdown',
                    'hierarchy_dropdown'];
        console.log('enabling', enabled);
        for(var n in elements){
            $('#'+elements[n]).addClass('disabled');
        }
        for(var n in enabled){
            $('#'+enabled[n]).removeClass('disabled');
        }
    };

    var type = getType(data);
    var to_enable= [];

    // hierarchical stuff 
    if (type != "undefined" || ( type == "array" && data.length >= 0)){
        to_enable.push ('draw_sunburst',
                        'draw_tree',
                        'draw_circle_pack',
                        'draw_treemap',
                        'draw_bubblechart',
                        'draw_table',
                        'hierarchy_dropdown');
    }
    if (type == "array"){
        type = getType(data[0]);
        if (type == "object" ){
            keys = Object.keys(data[0]);
            // at least one non numeric value

            if (keys.length >= 2 && all_numeric(data[0], 1) ){
                to_enable.push('draw_bar',
                            'draw_histogram',
                            'draw_scatter',
                            'draw_line',
                            '2d_dropdown');
                if (all_numeric(data[0], 0) == false) {
                    to_enable.push('draw_pie');
                }
            }
            if (keys.length >= 3 && all_numeric(data[0], 0)){
                to_enable.push('3d_dropdown', 'draw_3dsurface', 'draw_3dbars');
                
            }
        }
        else if (type == "number" ){
            to_enable.push('draw_histogram',
                          '2d_dropdown');
        }
        else if (type == "array"){
            to_enable.push('3d_dropdown', 
                           'draw_heatmap',
                           'draw_3dsurface', 
                           'draw_3dbars');
        }
    }
    enable(to_enable);
}

// this will make the nav-bar for visualization and the content to have a fixed size
function set_vis_size(){
    var w =  $("#vis_tab").width();
    var nav_w = 65;
    var vis_w = w-nav_w-60;
    $("#vis_nav").width(nav_w);
    $("#vis_content").width(vis_w);
}

set_vis_size();
$(window).on("resize", function(e){
    set_vis_size();
});


function correct_enabled_tab(graph){

    function get_graph_tab(graph){
        switch (graph){
            case "table":
                return "table_li";
            case "columnChart":
            case "barChart":
            case "pieChart":
            case "scatterChart":
            case "areaChart":
            case "histogram":
            case "line_chart":
                return "2d_li";
            case "surface_3d":
            case "bars_3d":
            case "heatmap":
                return "3d_li";
            case "sunburts":
            case "tree":
            case "circle_pack":
            case "treemap":
            case "bubble_chart":
                return "tree_li";
            case 'json_editor':
                return 'values_li';
            default:
                throw "unknown graph " + graph;
        }
    }
    var tab = get_graph_tab(graph);
    console.log( "showing tab", tab);
    if (tab != 'values_li'){
        $("#vis_tab #table_li").tab('show');
    }
    $("#vis_tab #"+tab).tab('show');
}

function draw_graph( graph, e){
    console.log("graph div", graph_div, graph);
    graph_div.innerHTML = '';
    correct_enabled_tab(graph);
    draw_data.last_draw = graph;
    draw_functions[graph]();
}

