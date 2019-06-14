SQLiteStorageService = function () {
    var service = {};
    var db = window.sqlitePlugin ?
        window.sqlitePlugin.openDatabase({name: "zen_app", location: "default"}) :
        window.openDatabase("zen_app", "1.0", "zen method saved locally", 2 * 1024 * 1024);

    service.initialize = function() {
        // Initialize the database
        //TEST ONLY
        /*
        db.transaction(function(transaction) {
          transaction.executeSql("DROP TABLE inventory",[], function(ignored, resultSet) {
              alert("inventory dropped.");
          });
        }, function(error) {
          alert('dropping table error: ' + error.message);
        }); */


        var deferred = $.Deferred();
        db.transaction(function(tx) {
            tx.executeSql(
              'CREATE TABLE IF NOT EXISTS inventory (' +
                'id integer primary key, ' +
                'name varchar UNIQUE, ' +
                'description text, ' +
                'category varchar,' +
                'inventory_type varchar,' +
                'tag varchar,' +

                'chapter_name varchar,' +
                'chapter_ordering integer,' +
                'chapter_description text,' +

                'source_name varchar,' +
                'source_type varchar,' +
                'source_url varchar,' +
                'source_author varchar,' +
                'source_description text,' +

                'privatenote_create_time text,' +
                'privatenote_modify_time varchar,' +
                'privatenote_note varchar,' +

                'isfavorite integer' +
              ')'
            ,[], function(tx, res) {
               /* TEST ONLY
                tx.executeSql('DELETE FROM inventory', [], function(tx, res) {
                    alert("data deleted");
                    deferred.resolve(service);
                }, function(tx, res) {
                    deferred.reject('Error initializing database');
                });
              */
              console.log("initializing database.");
              deferred.resolve(service);
            }, function(tx, res) {
                deferred.reject('Error initializing database');
            });
        });
        return deferred.promise();
    }

    service.getDetail = function(id, callback){
      db.transaction(function(transaction) {
        transaction.executeSql("SELECT * FROM inventory WHERE id="+id,[], function(ignored, resultSet) {
            callback(resultSet.rows.item(0));
        });
      }, function(error) {
        alert('Search error: ' + error.message);
      });
    }

    service.getAll = function(callback){
      db.transaction(function(transaction) {
        transaction.executeSql("SELECT id,name,source_name,source_author FROM inventory",[], function(ignored, resultSet) {
            callback(resultSet.rows);
        });
      }, function(error) {
        alert('Get all error: ' + error.message);
      });
    }

    service.getInventories = function(type,category,tag,source,chapter,q,callback) {
      sql = 'SELECT * FROM inventory';
      if (q != null && q.length > 0){
        sql = sql + " where ";
        kws = q.split(",");
        for (var i=0; i<kws.length-1; i++){
          var kw = kws[i];
          sql = sql + "name REGEXP '(?i)' || \b(kw)\b OR " +
                      "type REGEXP '(?i)' || \b(kw)\b OR " +
                      "category REGEXP '(?i)' || \b(kw)\b OR " +
                      "source REGEXP '(?i)' || \b(kw)\b OR " +
                      "chapter REGEXP '(?i)' || \b(kw)\b OR " +
                      "tag REGEXP '(?i)' || \b(kw)\b OR ";
        }
        var kw = kws[kws.length-1];
        sql = sql + "name REGEXP '(?i)' || \b(kw)\b OR" +
                    "type REGEXP '(?i)' || \b(kw)\b OR" +
                    "category REGEXP '(?i)' || \b(kw)\b OR" +
                    "source REGEXP '(?i)' || \b(kw)\b OR" +
                    "chapter REGEXP '(?i)' || \b(kw)\b OR" +
                    "tag REGEXP '(?i)' || \b(kw)\b ";
      } else {
        s = "";
        if (type) {
          for (var i=0; i<type.length-1; i++)
              s = s + "inventory_type='" + type[i] + "' or ";
          s = s + "inventory_type='" + type[type.length-1] + "'";
        } if(category) {
          if (s.length > 0) s = s + " and ";
          for (var i=0; i<category.length-1; i++)
              s = s + "category='" + category[i] + "' or ";
          s = s + "category='" + category[category.length-1] + "'";
        } if(tag) {
          if (s.length > 0) s = s + " and ";
          for (var i=0; i<tag.length-1; i++)
              s = s + "tag like %'" + tag[i] + "'% or ";
          s = s + "tag like %'" + tag[tag.length-1] +"'%";
        } if(source) {
          if (source != null && source.length > 0) {
            if (s.length > 0) s = s + " and ";
            for (var i=0; i<source.length-1; i++)
                s = s + "source_name='" + source[i] + "' or ";
            s = s + "source_name='" + source[source.length-1] + "'";
          }
        } if(chapter) {
          if (chapter != null && chapter.length >0) {
            if (s.length > 0) s = s + " and ";
            for (var i=0; i<chapter.length-1; i++)
                s = s + "chapter_name='" + chapter[i] + "' or ";
            s = s + "chapter_name='" + chapter[chapter.length] + "'";
          }
        }
        if (s.length > 0) sql = sql + " where " + s;
      }
      db.transaction(function(transaction) {
        transaction.executeSql(sql,[], function(ignored, resultSet) {
            callback(resultSet.rows);
        });
      }, function(error) {
        alert('Search error: ' + error.message);
      });
    }

    service.addInventory = function(id, name, description, category, inventory_type,
                                    tag,chapter_name,chapter_ordering,source_name,
                                    source_author,privatenote_note,isfavorite, callback) {
      sql = "INSERT OR REPLACE INTO inventory (id, name, description, category, inventory_type," +
                                      "tag,chapter_name,chapter_ordering,source_name," +
                                      "source_author,privatenote_note,isfavorite) " +
            "VALUES(?,?,?,?,?,?,?,?,?,?,?,?)"
      db.transaction(function(transaction) {
        transaction.executeSql(sql,[id,name,description, category, inventory_type,tag,chapter_name,chapter_ordering,source_name,source_author,privatenote_note,isfavorite], function(ignored, resultSet) {
            callback("ok");
        });
      }, function(error) {
        callback("error: " + error.message);
      });
    }

    service.removeInventory = function(id, callback) {
      sql = "DELETE FROM inventory where id=?";
      db.transaction(function(transaction) {
        transaction.executeSql(sql,[id], function(ignored, resultSet) {
            callback("ok");
        });
      }, function(error) {
        callback("error: " + error.message);
      });
    }

    service.getSource = function(callback) {
      db.transaction(function(transaction) {
        sql = "SELECT DISTINCT source_name FROM inventory";
        transaction.executeSql(sql,[], function(ignored, resultSet) {
            var data = resultSet.rows;
            var sources = [];
            for(var i=0; i<data.length; i++){
              source = {};
              source["id"] = i+1;
              source["name"] = data.item(i).source_name;
              sources.push(source);
            }
            callback(sources);
        });
      }, function(error) {
        alert('Get source error: ' + error.message);
      });
    }

    service.getChapter = function(source, callback) {
      db.transaction(function(transaction) {
        transaction.executeSql("SELECT DISTINCT chapter_name FROM inventory where source_name='"+source+"'",[], function(ignored, resultSet) {
            var chapters = [];
            var data = resultSet.rows;
            for(var i=0; i<data.length; i++){
              chapter = {};
              chapter["id"] = i+1;
              chapter["name"] = data.item(i).chapter_name;
              chapters.push(chapter);
            }
            callback(chapters);
        });
      }, function(error) {
        alert('get Chapter error: ' + error.message);
      });
    }

    return service.initialize();
}
