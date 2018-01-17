
// this is to add capitalization for strings as seen on
// http://stackoverflow.com/questions/2332811/capitalize-words-in-string/7592235#7592235
String.prototype.capitalize = function() {
    return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
};

// this function was adapted from :
//http://stackoverflow.com/questions/332422/how-do-i-get-the-name-of-an-objects-type-in-javascript
// like this I can get arrays types and all of that
function getType(obj)  { 
	if (typeof obj == "undefined") return "undefined";
    if (obj == null) {
        console.log("null type!");
        return "null";
   }
    
	var funcNameRegex = /function (.{1,})\(/;
	var results = (funcNameRegex).exec((obj).constructor.toString());
	var type =  (results && results.length > 1) ? results[1] : "";
	return type.toLowerCase();

};

// gets the value to insert in a visualization table
function getRowType(obj){
	var type = getType(obj);
	switch(getType(obj)){
		case "number":
		case "date":
			return type;
		default:
			return "string";
	}    
}

// function to convert a object so that it can drawn
//for the time being converts everything to a json string except few basic values
function getObjValue(obj){
	switch(getType(obj)){
		case "number":
		case "date":
		case "string":
			return obj;
        case "null":
            console.log("null value returning undefined");
            return undefined;
		default:
			return objToString(obj);
	}
}

//transform an object to the string representation
//improve this later for fancier string repsentations
function objToString(obj){
    return JSON.stringify(obj);
}


//function that transforms data to a matrix (for heatmap)
function dataToMatrix(data){
    var matrix = [];
    var type = getType(data[0]);
    switch(type){
        case "object":
            throw("Object array to matrix not implemented")
            break;
        case "array":
            return data;
        case "undefined":
            console.log("could not draw empty array " , data)
            break;
            // if it is not an array or object supposes it is a builtin type and just adds rows like that
        default:
            throw ("Array of type: " + type + ", cannot be converted to matrix");
    }
    return matrix;
}

function arrayToTable(data) {

    var table = '<div class="table-container"><table class="nested-table">\n'

    switch(getType(data[0])){
        case "object":
            table += "<tr>";
            for (var name in data[0]){
                table += "<th>" + name + "</th>"
            }
            table += "</tr>\n"
            for(var n = 0; n < data.length; n ++) {
                table += "<tr>";
                for (var name in data[n]){
                    table += "<td>" + getObjValue(data[n][name]) + "</td>";
                }
                 table += "</tr>\n";
            }
            break;
            //TODO: find way of drawing 2d Arrays (check the min of the lenghts and stringify the rest)
            //case "array":
        case "undefined":
            console.log("could not draw empty array " , data)
            break;
            // if it is not an array or object supposes it is a builtin type and just adds rows like that
        default:
            table += "<tr><th>" + getType(data[0]) + "</th></tr>\n";
            for(var n = 0; n < data.length; n ++) {
                table += "<tr><td>" + getObjValue(data[n][name]) + "</td></tr>\n";
            }

    }
    table += "</table></div>"
    return table;

}

//function that converts arrays to visualization tables
function arrayToDataset(data, differentColors){
    var labels = undefined;
	var datasets = [];
    var colors = ['rgb(127, 127, 255)', 'rgb(255, 127, 127)', 'rgb(127, 255, 127)', 'rgb(198, 99, 198)', 'rgb(99, 99, 99)']
	switch(getType(data[0])){
		case "object":
		    var counter = 0;
			for (var name in data[0]){
                var dataColors = undefined;
                if (differentColors) {
                    dataColors = data.map(function(x, n) {
                         return colors[n % colors.length]
                     });
                } else {
                    dataColors = colors[counter -1];
                }
			    if (counter == 0) {
			        labels = data.map(function(x) {
                         return getObjValue(x[name])
                     });
			    } else {
			        datasets.push({
                        label: name,
                        backgroundColor: dataColors,
                        borderColor: 'rgb(0, 0, 0)',
                        data: data.map(function(x) {
                            return getObjValue(x[name])
                        })
                    });
			    }
                counter++
			}

			break;
			//TODO: find way of drawing 2d Arrays (check the min of the lenghts and stringify the rest)
			//case "array":
		case "undefined":
			console.log("could not draw empty array " , data)
			break;
			// if it is not an array or object supposes it is a builtin type and just adds rows like that
		default:
		    datasets.push({
                label: getType(data[0]),
                backgroundColor: colors[0],
                borderColor: 'rgb(0, 0, 0)',
                data: data
            })
	}
	return {
	    labels: labels,
	    datasets: datasets
	}
}

// recursive function that finds a object in the tree with a certain name
function transverse(obj , name) {
    if ( obj.name == name ){ 
        return obj;
    }
    for(var i in obj.children){
        var p = transverse(obj.children[i], name ) ;
        if (p != undefined) return p;
   }

   return undefined;
}

//finds object in the tree and inserts it if it is not found
function getObjNode(name, root){
    var node = transverse(root, name);
    if (node == undefined || node == null) {
        node = {name: name, size:0};
        if (!root.children) root.children = [];
        root.children.push(node)
    }
    return node;
}

// special case of arrays of objects
// this will build an hierarchy by doing a "group by" starting from the end
function getChildrenFromObjArray(data, root, defaultName ){

    var types = [];
    var names = [];
    
    for (var name in data){
        types.push( getType(data[name]));
        names.push(name);
    }

    var curr_root = root;
    // this object accumulates integers and children to be added to the last node
    var acc = {name: undefined, size: 0 , children : []}

    if (names.length <= 0){
        console.log("why the hell this obj does not have properties?!");
        return;
    }
    for (var n = names.length -1; n >= 0 ; n-- ){
        if(types[n] == 'string'){
            // finds if this node exists 
            var name = data[names[n]];
            var node = getObjNode(name, curr_root);
            // next item will be inserted at the level of the current node
            curr_root = node;
            acc.name = name;
        }
        else if (types[n] == 'number')
        {
            acc.size += data[names[n]];
        }
        else {
            node= { name : names[n], children : [] };
            acc.children.push(node)
            getChildren(data[names[n]], node, names[n]);
        }
    }
    // if there were no strings
    if (acc.name == undefined ){
        console.log("node does not have a name, defaulting to ", defaultName);
        acc.name = defaultName;
    }
    if (acc.size == 0){
        console.log("node does not have a size, defaulting to ", 1);
        acc.size = 1;
    }
    //gets the last node and sets the new children and the accumulated counter
    var last_node = getObjNode(acc.name, curr_root);
    if(acc.children.length){
        last_node['children'] = acc.children; 
    }
    last_node.size = acc.size;
}

//generates hierarchies from arrays
// on arrays of objects it will try to group-by (we might have to review this thing )
// see getChildrenFromObjArray function
function getChildrenArray(data, root, defaultName ){
    switch(getType(data)){
        // cases number and string are the same as 
        case "number":
            root.children.push({ name : defaultName, size : data});
            break;
        case "string":
            root.children.push({ name : data, size : 1});
            break;
        case "object":
            for (var name in data ){
                // here it will try to create an hierarchy
                getChildrenFromObjArray(data, root, name);
            }
            break;
        default:
            node= { name : defaultName, children : [] };
            root.children.push(node)
            getChildren(data, node, defaultName);
            break;
    }
}
// generates hierarchies from objects 
function getChildrenFromOb(data, root ){
    for (var name in data){
        switch(getType(data[name])){
            case 'string':
                root.children.push({ name : data[name], size : 1});
                break;
            case 'number':
                root.children.push({ name : name, size : data[name]});
                break;
            default:
                node= { name : name, children : [] };
                root.children.push(node)
                getChildren(data[name], node, name);
        }
    }
}

// Creates an hierarchy from data and inserts it in "root"
// default name is 
function getChildren(data,root, defaultName){

    // if it does not find a string to assign to a name defaults to 'number'
    defaultName = typeof defaultName !== 'undefined' ? defaultName : "value";

    switch(getType(data)){
        case "object":
            getChildrenFromOb(data, root );
            break;
        case "array":
            if (data.length == 1){
                getChildrenFromOb(data[0], root);
            }
            else{
                for(var i in data){
                    getChildrenArray(data[i], root, defaultName +":"+String(i));
                }
            }   
            break;        
        case "number":
            root.children.push({ name : defaultName, size : data});
            break;
        case "string":
            root.children.push({ name : data, size : 1});
            break;
        default:
            root.children.push({ name : String(data), size : 1});
            break;
    }
}

//converts n data to a hierarchy that can be drawn using a sunburst, a tree view etc..
function dataToHierarchy(data){

    var root= {name: "root", children:[]};
    getChildren(data, root);
    console.log(root);
    return root;
}


function getCsvValue(obj){
    	switch(getType(obj)){
		case "number":
		case "date":
			return obj;
		case "string":
			return obj;
		default:
			return '"' + objToString(obj) + '"';
	}
}

function arrayToMatrix(data){
	var out = [];
    
	switch(getType(data[0])){
		case "object":
		    var header = [];
			for (var name in data[0]){
				header.push(name);
			}
            out.push(header);
			for(var i= 0;i < data.length;i++){        
				var row = [];
				for(var name in data[i]){
					row.push(getCsvValue(data[i][name]))
				}            
				out.push(row);
			}   

			break;
			//TODO: find way of drawing 2d Arrays (check the min of the lenghts and stringify the rest)
			//case "array":
		case "undefined":
			console.log("could not draw empty array " , data)
			break;
			// if it is not an array or object supposes it is a builtin type and just adds rows like that
		default:
			out.push( [ getType(data[0]) ] );
			for(var i= 0;i < data.length;i++){        
				out.push( [ getCsvValue(data[i]) ] );	                    
			} 
	}
	return out;
}

function objToMatrix(obj){
    var out= [];

    switch( getType(obj) ){
        case "array":
            return arrayToMatrix(obj);
        case 'object':
            out.push([]);
            for(var name in obj){
                out[0].push(name);
            }
            out.push([]);
            for(var name in obj){
                out[1].push( getCsvValue(obj[name]) );
            }
            return out;
        case "undefined":
            console.log("ERROR: data is undefined, visualization table is empty")
            return out;
        default:
            out[0] = [getType(obj)]; 
            out[1]= [getCsvValue(obj)];
            return out;
    }
}

function objToCSV(obj){
    var separator = ',';
    var out = "";
    var matrix = objToMatrix(obj);
    for (var n in matrix){
        out += matrix[n].join(separator) + "\n";
    }
    return out;
}

function objToHtmlTable(obj, doc){
    if ( doc == undefined ) doc = true;
    var out = '<table>\n';
    
    var matrix = objToMatrix(obj);
    if (matrix.length < 1) {
        out +='</table>';
        return out;
    }
    out += '\t<thead ><tr>';
    header = matrix[0];
    for (var n in header){
        out += '<th>' + header[n] + '</th>';
    }
    out += '</tr></thead>\n';

    for (var n=1; n <  matrix.length ; n++){
        out += '\t<tr>'
        for (var i in matrix[n]){
            out += '<td>'+matrix[n][i]+'</td>';
        }
        out += '</tr>\n';
    }

    out += "</table>";
    
    if (doc){
        var header = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">\n'+
                    '<head>\n'+
                    '\t<!--[if gte mso 9]><xml>\n'+
                    '\t\t<x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>\n'+
                    '\t\t\t<x:Name>Query Results</x:Name>\n'+
                    '\t\t\t<x:WorksheetOptions>\n'+
                    '\t\t\t\t<x:DisplayGridlines/>\n'+
                    '\t\t\t</x:WorksheetOptions>\n'+
                    '\t\t</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook>\n'+
                    '\t</xml><![endif]-->\n'+
                    '</head>\n'+
                    '<body>\n';
        var termination = "\n</body>\n</html>";
        return header + out + termination;
    }
    else{
        return out;
    }
    
}
