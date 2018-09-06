//DEPENDENCIES
require('dotenv').config()
const { Client } = require('pg');
var express = require('express'); 
var app = express();
app.use(express.static(__dirname + '/public'));
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended : true}));
var cheerio = require('cheerio'); //web scraper for nodejs

//including jQuery
var $ = require('jquery'); //newest version of jquery
var request = require('request');

var h1 = "<!DOCTYPE html><html><head><title> KFinance </title><meta charset = \"utf-8\" /><link rel=\"stylesheet\" href=\"style.css\" type=\"text/css\" /></head><body>";
var h2 = "</body></html>";

//step ONE
app.get('/', function (req, res) {
	console.log('in index');

});

	DATABASE_URL = process.env.db_connect;
	const client = new Client({
  	connectionString: DATABASE_URL,
  	ssl: true,
	});
	client.connect();


app.post('/buy', function (req, res){
	console.log('in buy stock');
	
	var stock = req.body.stock;
	var count = Number(req.body.count);
	var datetime = new Date(); //gets date of stock purchase

	// callback

	    //if share DOES NOT already exist
	datetime = datetime.toString();
	datetime = datetime.substr(0,10);
	    
	var query_ins = 'insert into portfolio (stock,num_shares,date_p) values(\''+stock+'\','+count+','+'\''+datetime+'\')';
	console.log(query_ins);
	client.query(query_ins, (err3, res3) => {
		if (err3) {
			console.log(err3.stack)
		} else {
			console.log(res3.rows[0])
		}
	});		
res.redirect('/');
});



app.get('/check', function(req,res){
	var query2 = 'select * from portfolio';
	client.query(query2, (err5, res5) => {
  	if (err5) {
    	console.log(err5.stack)
  	} else {
  		var port = res5.rows;

		var all = []; // create an empty array


		//parsing JSON from database
		for (var i=0; i < port.length; i++){
			//check if key exists
			var updated = false;
			for (var j = 0; j < all.length; j++){
				if (port[i].stock == all[j].stock){
					all[j].num += parseFloat(port[i].num_shares);
					updated = true;
					break;
				}
			}
			//if (!(port[i].stock in all)){
				if (!updated){
					all.push({
	    				stock: port[i].stock,
	    				num: parseFloat(port[i].num_shares)
					});
				}

		}
		var allstocks = [];
		//checks to see how all is filled up
		for (var i=0; i < all.length; i++){
				console.log(all[i]);
				console.log(all[i].stock);
				console.log(all[i].num);
				//removing spaces
				var ticker =  all[i].stock;
				ticker = ticker.replace(/\s/g, '');
				//str = str.replace(/\s/g, '');
				allstocks.push([ticker,all[i].num]);
				console.log(allstocks);
			}
			//all stocks now contain entire portfolio
			var toShow = "<p>Your current portfolio is as follows: </p>";
			for (var i = 0; i < allstocks.length; i++){
				toShow+="<p>";
				toShow+=allstocks[i][0];
				toShow+=" ... ";
				toShow+=allstocks[i][1];
				toShow+="</p>";
			}
			toShow+="<p>Never invest on a tip!</p>";
			toShow+="</form><a href=\"index.html\"><button>Return Home</button></a></form>";
		
		//set response type to html
		res.set('Content-Type', 'text/html'); //convert data from JSON to html so it is compiled as html
  		//console.log(res5.rows);
  		//build up html file as you extract data like indexPage += "<table></table"
  		var html1 = "<!DOCTYPE html><html><head><title> KFinance </title><meta charset = \"utf-8\" /><link rel=\"stylesheet\" href=\"style.css\" type=\"text/css\" /></head><body>";
  		var html2 = "</body></html>";

  		res.send(html1+toShow+html2); // return LITERAL HTML FILE
  	}
	});
});

app.post('/komb', function(req,res){
	console.log('in komb');
	
	var stock = req.body.stock;
	var stock_url1 = 'https://finance.yahoo.com/quote/'+stock+'/financials?p=\''+stock;
	var stock_url2 = 'https://finance.yahoo.com/quote/'+stock+'/balance-sheet?p='+stock;

	var elems1 = [];
	var elems2 = [];
	var kombs1 = [];
	var kombs2 = [];
	//from income statement
	request(stock_url1, function (error1, response1, html1) {
	  	if (!error1 && response1.statusCode == 200) {
		    var $ = cheerio.load(html1);
		    
		    var a = $('td').each(function(i, elem1){
		    	elems1[i] = $(this).text();
		    });
		    elems1.join(' ,'); 
		    //request within request so all data is retrieved in same function call: AJAX
		    	request(stock_url2, function (error2, response2, html2) {
			  		if (!error2 && response2.statusCode == 200) {
				    	var $ = cheerio.load(html2);
				    
				    	var a = $('td').each(function(i, elem2){
				    		elems2[i] = $(this).text();
				    	});   
				    	elems2.join(' ,');
			  
			  			//ALL KOMBS
						kombs1 = {data_past : elems1[5], rev_n : elems1[7], rev_p: elems1[9], net_income_n : elems1[91], net_income_p: elems1[93], net_assets_p : elems2[144],
						net_assets_n : elems2[142], ltdebt_p: elems2[83], ltdebt : elems2[81], tclia_p: elems2[79], tclia : elems2[77], tcasset_p : elems2[30], tcasset : elems2[28],
						num_stock_mil_p : elems2[120], num_stock : elems2[118]};
						//sending data
						//Building html
						var html2send = "";
						html2send+="<p>"+stock+"'s journey between now and "+kombs1.data_past+" looked like ...</p>";
						html2send+="</p> Balance Sheet <p>";
						//ASSET
						html2send+="<p> Net Assets (past): $"+kombs1.net_assets_p+"K --> Net Assets (now): $"+ kombs1.net_assets_n+"K";
						var ass_change = ((parseFloat(kombs1.net_assets_n)-parseFloat(kombs1.net_assets_p))/parseFloat(kombs1.net_assets_p))*100;
						var dir = "";
						if (ass_change<0) dir+="drop";
						else dir+="growth";
						html2send+=", therefore, a "+ ass_change.toFixed(2)+ " % "+ dir+"</p>";
						//Long-term Debt
						html2send+="<p> Long-term debt (past): $"+kombs1.ltdebt_p+"K --> Long-term debt (now): $"+ kombs1.ltdebt+"K";
						var debt_change = ((parseFloat(kombs1.ltdebt)-parseFloat(kombs1.ltdebt_p))/parseFloat(kombs1.ltdebt_p))*100;
						dir = "";
						if (debt_change<0) dir+="drop";
						else dir+="growth";
						html2send+=", therefore, a "+ debt_change.toFixed(2)+ " % "+ dir+"</p>";
						//Revenue
						html2send+="</p> Income Statement <p>";
						html2send+="<p> Revenue (past): $"+kombs1.rev_p+"K --> Revenue (now): $"+ kombs1.rev_n+"K";
						var rev_change = ((parseFloat(kombs1.rev_n)-parseFloat(kombs1.rev_p))/parseFloat(kombs1.rev_p))*100;
						dir = "";
						if (rev_change<0) dir+="drop";
						else dir+="growth";
						html2send+=", therefore, a "+ rev_change.toFixed(2)+ " % "+ dir+"</p>";
						//Net Income
						html2send+="<p> Net Income (past): $"+kombs1.net_income_p+"K --> Net Income (now): $"+ kombs1.net_income_n+"K";
						var ni_change = ((parseFloat(kombs1.net_income_n)-parseFloat(kombs1.net_income_p))/parseFloat(kombs1.net_income_p))*100;
						dir = "";
						if (ni_change<0) dir+="drop";
						else dir+="growth";
						html2send+=", therefore, a "+ ni_change.toFixed(2)+ " % "+ dir+"</p>";

						//Metrics
						html2send+="<p>Here are the historical metrics for "+stock+ " for "+ kombs1.data_past+ ". Find the next "+ stock+ " ?</p>";
						var eps = (parseFloat(kombs1.net_income_p)/parseFloat(kombs1.num_stock_mil_p)).toFixed(2);
						html2send+="<p> EPS: $"+eps+"/share...<p>";
						var roa = (parseFloat(kombs1.net_income_p)/parseFloat(kombs1.net_assets_p)).toFixed(2);
						html2send+="<p> ROA (Asset Efficiency): "+roa+"...<p>";
						var cr = (parseFloat(kombs1.tcasset_p)/parseFloat(kombs1.tclia_p)).toFixed(2);
						html2send+="<p> Current Ratio (Short-term Assets vs. Short-term Debt): "+cr+"...<p>";
						html2send+="</form><a href=\"index.html\"><button>Return Home</button></a></form>";

						console.log(kombs1);
						res.send(h1+html2send+h2);
			  		}
				});


		}
	});

	 


});

app.get('/public/tu.html', function (req, res) {
  res.send("Works!\n");

  //res.sendFile(path.join(__dirname + '/public/tu.html'));
});



app.listen(process.env.PORT||5000);

//DEPRECATED
/*
app.post('/buy', function (req, res){
	console.log('in buy stock');
	
	var stock = req.body.stock;
	var count = req.body.count;
	var datetime = new Date(); //gets date of stock purchase
	//beginning scraping:
	var stock_url = 'https://finance.yahoo.com/quote/'+stock+'/key-statistics?p=\''+stock;

	console.log(typeof Number(count));
	var count = Number(count); //type cast to number

	//add existing number of shares to current
	//delete all instance of current
	//update with new num and date
	//var query_num = 'select num_shares from portfolio where stock=\''+stock+'\'';
	var query_num = 'select num_shares from portfolio where stock=\''+stock+'\'';
	console.log(query_num);

	// callback
	client.query(query_num, (err1, res1) => {
  	if (err1) {
    	console.log(err1.stack)
  	} else {
    	console.log(res1.rows[0]);
    		if (res1.rows[0]!=undefined){
    			console.log('buying more of stock that already exists!\n');
	    	var num_shares = res1.rows[0]['num_shares'];
	    	console.log(num_shares);
	    	console.log(typeof num_shares);
	    	if (num_shares!=0){
	    		console.log("deleting stock\n");
	    		var query_del = 'delete from portfolio where stock=\''+stock+'\'';
	    		client.query(query_del, (err2, res2) => {
	  			if (err2) {
	    			console.log(err2.stack)
	  			} else {
	    			console.log(res2.rows)
	    			//insert stock
	    			var num = num_shares+count;
	    			var date = new Date();
				    console.log('date is:');
				    //date = date.substr(0,10);
				    
				    date = date.toString();
				    date = date.substr(0,10);
				    //console.log(typeof date);
				    //date = date.replace(/\s/g, ''); //removing spaces from date
				    console.log(date);
	    			var query_ins = 'insert into portfolio (stock,num_shares,date_p) values(\''+stock+'\','+num+','+'\''+date+'\')';
	    			console.log(query_ins);
		    		client.query(query_ins, (err3, res3) => {
		  			if (err3) {
		    			console.log(err3.stack)
		  			} else {
		    			console.log(res3.rows[0])
		    			//insert stock	
		  			}
					});
	  			}
				});
	    	}
	    }
	    //if share DOES NOT already exist
	    var num = count;
	    var date = new Date();
	    console.log('date is:');
	    //date = date.substr(0,10);
	    
	    date = date.toString();
	    date = date.substr(0,10);
	    //console.log(typeof date);
	    //date = date.replace(/\s/g, ''); //removing spaces from date
	    console.log(date);
	    
	    var query_ins = 'insert into portfolio (stock,num_shares,date_p) values(\''+stock+'\','+num+','+'\''+date+'\')';
	    console.log(query_ins);
		client.query(query_ins, (err3, res3) => {
		if (err3) {
			console.log(err3.stack)
		} else {
			console.log(res3.rows[0])
		}
		});		
  	}
	});
	


	request(stock_url, function (error, response, html) {
	  if (!error && response.statusCode == 200) {
	    var $ = cheerio.load(html);
	    
	    const elems = [];
	    var a = $('td').each(function(i, elem){
	    	elems[i] = $(this).text();

	    });

	    elems.join(' ,');

	    //creating a dictionary of interesting metrics
	    const lOfInt = {shares_out : elems[83], total_debt : elems[53], total_cash: elems[49], EPS : elems[45], EBITDA: elems[41],
	    	revenue: elems[33], roa: elems[29], profit_margin: elems[24], market_cap: elems[3]}; 
		
	    console.log("works just fine!\n");
	    console.log(lOfInt.shares_out);

	  }
	});
	res.redirect('/public/tu.html');
});

*/

/*
app.post('/komb', function(req,res){
	console.log('in komb');
	
	var stock = req.body.stock;
	var stock_url1 = 'https://finance.yahoo.com/quote/'+stock+'/financials?p=\''+stock;
	var stock_url2 = 'https://finance.yahoo.com/quote/'+stock+'/balance-sheet?p='+stock;

	var elems1 = [];
	var elems3 = [];
	//from income statement
	request(stock_url1, function (error, response, html) {
	  if (!error && response.statusCode == 200) {
	    var $ = cheerio.load(html);
	    
	    var a = $('td').each(function(i, elem1){
	    	elems1[i] = $(this).text();
	    	//console.log(i+"th element is "+elems[i]);
	    	//console.log("\n");
	    });
	    elems1.join(' ,');
	    //komb1
	    //var kombs1 = {data_past : elems1[5], rev_n : elems1[7], rev_p: elems1[9], net_income_n : elems1[91], net_income_p: elems1[93]};
	    //console.log(kombs1);


	}
	});

	 request(stock_url2, function (error, response, html) {
	  if (!error && response.statusCode == 200) {
	    var $ = cheerio.load(html);
	    
	    var a = $('td').each(function(i, elem3){
	    	elems3[i] = $(this).text();
	    	//console.log(i+"th element is "+elems3[i]);
	    	//console.log("\n");
	    });   
	    elems3.join(' ,');
  	//get number of shares
  	var kombs3 = {net_assets_p : elems3[144], net_assets_n : elems3[142], ltdebt_p: elems3[83], ltdebt : elems3[81], tclia_p: elems3[79], tclia : elems3[77], tcasset_p : elems3[30], tcasset : elems3[28],
		num_stock_mil_p : elems3[120], num_stock : elems3[118]};
		console.log(kombs3);
		//sample response
		res.send(kombs3);
	  }
	});

	var kombs = {data_past : elems1[5], rev_n : elems1[7], rev_p: elems1[9], net_income_n : elems1[91], net_income_p: elems1[93], net_assets_p : elems3[144],
		net_assets_n : elems3[142], ltdebt_p: elems3[83], ltdebt : elems3[81], tclia_p: elems3[79], tclia : elems3[77], tcasset_p : elems3[30], tcasset : elems3[28],
		num_stock_mil_p : elems3[120], num_stock : elems3[118]};
		//sending data
		console.log(kombs);
		//res.send(kombs);

});
*/
