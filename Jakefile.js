var exec = require('child_process').exec;

desc('This is the default task.');
task('default', ['lint','test'], function (params) {
  
});

desc('Run the linter');
task('lint', [], function (params) {
	var linter = require('linter');

	linter.run({
    		files: "./src/", // can be an array or directory
		config: "server", /// can be an object, path to a conf.json or config name e.g. "server"
    		recursive: true, 
    		format: true, // set to true if you want to get a string as errors argument, formatted for console output
		callback : function(errors) {
			console.log(errors);
		}
	});	
});

desc('Run the tests');
task('test', [], function (params) {
	exec('./node_modules/expresso/bin/expresso', function (error, stdout, stderr) { 
		console.log(stdout); 
		console.log(stderr); 			
	});	
});
