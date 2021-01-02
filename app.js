//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash")

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todoListDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const itemSchema = new mongoose.Schema({
  name: String
});

const ToDoItem = mongoose.model("ToDoItem", itemSchema);

const first = new ToDoItem({
  name: "buy food"
});

const second = new ToDoItem({
  name: "cook food"
});

const third = new ToDoItem({
  name: "eat food"
});

const defaultItems = [first, second, third];

const listSchema = new mongoose.Schema({
  name: String,
  item: [itemSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  ToDoItem.find(function(err, todoItems) {
    if (todoItems.length === 0) {
      ToDoItem.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Success");
        }
        res.redirect("/");
      });
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: todoItems
      });
    }
  });
});

app.get("/:todoListTitle", function(req, res) {

  const customListTitle = _.capitalize(req.params.todoListTitle);
  List.findOne({
    name: customListTitle
  }, function(err, results) {
    if (err) {
      console.log(err);
    } else if (results) {
      res.render("list", {
        listTitle: customListTitle,
        newListItems: results.item
      });
    } else if (!results) {
      //create new List
      const newList = new List({
        name: customListTitle,
        item: defaultItems
      });
      console.log(newList);
      newList.save();

      res.redirect("/" + customListTitle);
    };
  });
});

app.post("/", function(req, res) {
  const listName = req.body.list;
  const addItem = new ToDoItem({
    name: req.body.newItem
  });

  if (listName === "Today") {
    addItem.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function(err, list) {
      list.item.push(addItem);
      list.save();
      console.log(list.item);
      res.redirect("/" + listName);
    });
  }

});

app.post("/delete", function(req, res) {
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    ToDoItem.deleteOne({
      _id: checkedItemID
    }, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Success");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({
        name: listName
      }, {
        $pull: {
          item: {
            _id: checkedItemID
          }
        }
      },
      function(err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }

});

app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
