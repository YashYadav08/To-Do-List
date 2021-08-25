//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require('dotenv').config();
//var items = [];

const app= express();

app.set("view engine","ejs");

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

mongoose.connect(process.env.Mongo_Url, {useNewUrlParser:true,useUnifiedTopology:true, useFindAndModify:false});

//Schema->model->document (document = rows of sql, model = table, schema is the format)
const itemsSchema = {   //Schema for our Database
    name: String
};

const Item = mongoose.model("Item", itemsSchema);   //model based on the itemsSchema

//making a few documents for the list(documents are same as rows in sql)(Here the To-Do-List items/tasks)
const item1 = new Item({
    name: "This is Task-1: Go and Sleep"
});
const item2 = new Item({
    name: "Workout time"
});
const item3 = new Item({
    name: "Get back to studying after eating some food."
});

const defaultItems = [item1, item2, item3]; //default items array

const listSchema = {
    name: String,
    items: [itemsSchema]
};
const List = mongoose.model("List", listSchema);

app.get("/", function(req,res)
{
    var today = new Date();
    var options= { weekday:"long", day:"numeric", month:"long"};
    var day = today.toLocaleDateString("en-US", options);

    Item.find({}, function(err, reslist){
        if(reslist.length === 0)
        {
            Item.insertMany(defaultItems, function(err){
                if(err){
                    console.log(err);
                }else{
                    console.log("Successfully saved Default-Items to the Database.");
                }
            });
            res.redirect("/");
        }else{
            res.render("list", {listTitle:day, newListItems: reslist});
        }
    });
});

//For custom webpages
app.get("/:customListName", function(req,res){
    const customListName = _.capitalize(req.params.customListName);
    
    List.findOne({name:customListName}, function(err, reslist){
        if(!err){
            if(!reslist){
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/"+customListName);
            }
            else{
                res.render("list", {listTitle:reslist.name, newListItems:reslist.items});
            }
        }
    });
});

app.post("/", function(req,res)
{
    const itemName = req.body.newItem;
    const listName = req.body.Button;

    var today = new Date();
    var options= { weekday:"long", day:"numeric", month:"long"};
    var day = today.toLocaleDateString("en-US", options);

    const newitem = new Item({
        name: itemName
    });

    if(listName === day){   //for every item added to today's list
        newitem.save();
        res.redirect("/");  //This will redirect it to the app.get part
    }else{  //for items added to custom list
        List.findOne({name:listName}, function(err, reslist){
            reslist.items.push(newitem);
            reslist.save();
            res.redirect("/"+listName);
        });
    }
   
});
//random comment
app.post("/delete", function(req,res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listTitle;

    var today = new Date();
    var options= { weekday:"long", day:"numeric", month:"long"};
    var day = today.toLocaleDateString("en-US", options);

    if(listName === day){
        Item.findByIdAndRemove(checkedItemId, function(err){
            if(!err){
                console.log("Successfully removed the Checked Item!");
                res.redirect("/");
            }
        }); 
    }else{
        List.findOneAndUpdate({name:listName}, {$pull:{items:{_id: checkedItemId}}}, function(err, reslist){    //in list model.find__->first argument is list, second update, function
            if(!err){
                res.redirect("/"+listName);
            }
        });
    }
    
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
 
app.listen(port, function() {
  console.log("Server is live");
});