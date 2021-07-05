const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const _ = require("lodash");

const app = express();

const mongoose = require("mongoose");

// Basic setup to use ejs with express
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));

//To use static css in the website
app.use(express.static("public"));

mongoose.connect("mongodb+srv://xxxxx", {
  useNewUrlParser: true,
});

const itemSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemSchema);

/*Adding pre defined routine */

const item1 = new Item({
  name: "Drink Water",
});

const item2 = new Item({
  name: "Hit the + to add a new item",
});

const item3 = new Item({
  name: "<--- Hit this to delete an item",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema],
};

const List = mongoose.model("List", listSchema);


app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          
          console.log("Successfully saved");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  
  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });

        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show the existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName,
  });

  if(listName==="Today"){
    newItem.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}, function (err, foundList){
      foundList.items.push(newItem);
      foundList.save();

      res.redirect("/"+listName);
    })
  }

});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove({ _id: checkedItemId }, function (err) {
      if(!err){
        console.log("Success");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name:listName}, {$pull: {items: {_id:checkedItemId}}}, function(err,foundList){
      if(!err){
        res.redirect("/"+listName);
      }
    });
  }

});

app.listen(process.env.PORT || 3000, function () {
  console.log("server started on port 3000");
});
