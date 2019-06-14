var end_point = "http://longislandzen.herokuapp.com";
var END_POINT = "http://longislandzen.herokuapp.com/api/"

var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
};

function change_source(sel){
  name = sel.options[sel.selectedIndex].text;
  sid  = sel.value;
  $('#chapter-select').find('option').remove();
  if (sid != '-1') {
    if ($('#source-select').hasClass('offline')){
      controller.storageService.getChapter(name,function(data) {
        for(var i=0; i<data.length; i++){
          $('#chapter-select').append('<option value="'+data[i]['id']+'" selected>'+data[i]['name']+'</option>');
        }
        $('#chapter-select').prepend('<option value="-1" selected>All Chapter</option>');
      });
    } else {
      $.ajax({
          url: end_point + '/chapter_list?sid='+(sid),
          type: 'GET',
          success: function(responseData) {
            var data = responseData["data"];
            for(var i=0; i<data.length; i++){
              $('#chapter-select').append('<option value="'+data[i]['id']+'" selected>'+data[i]['name']+'</option>');
            }
            $('#chapter-select').prepend('<option value="-1" selected>All Chapter</option>');
          },
          error: function(xmlhttprequest, textstatus, message) {
            $('#show-message-dialog').click();
            $('#message-title').text("Connection Error");
            $('#message-content').text("Something went wrong. Please try again later.");
          }
      });
    }
  }
}

function set_list(list){
  $('#search-result-div').empty();
  for (var i=0; i<list.length; i++){
    var tags = list[i]['tag'];
    var t = '';
    for (var j=0; j<tags.length; j++){
      t = t + tags[j]['name'] + ",";
    }
    if (t.length > 0){
      t = t.slice(0,-1);
    }
    $('#search-result-div').append(
      '<div class="agileinfo_your_search_right_grid inventory-display">' +
        '<a href="#" onclick="get_detail('+list[i]["id"]+')">' +
        '<h4>'+list[i]['name']+'<i class="glyphicon glyphicon-chevron-right" style="float:right;color:#999999;" aria-hidden="true"></i></h4>' +
        '<div class="agileinfo_search_grid_right" style="margin-top:1em"><ul>' +

        '<li>'+list[i]['source_chapter']['source']['author']+' | '+list[i]['source_chapter']['source']['name']+'</li>' +
        '<li>'+list[i]['inventory_type']+' | '+list[i]['category']+'</li>' +
        '<li>'+t+'</li>' +
        '</ul></a></div>');
  }
}

function set_list_local(list){
  $('#search-result-div').empty();
  for (var i=0; i<list.length; i++){
    var row = list.item(i);
    $('#search-result-div').append(
      '<div class="agileinfo_your_search_right_grid inventory-display">' +
        '<a href="#" onclick="get_detail_local('+row["id"]+')">' +
        '<h4>'+row['name']+'<i class="glyphicon glyphicon-chevron-right" style="float:right;color:#999999;" aria-hidden="true"></i></h4>' +
        '<div class="agileinfo_search_grid_right" style="margin-top:1em"><ul>' +

        '<li>'+row['source_author']+' | '+row['source_name']+'</li>' +
        '<li>'+row['inventory_type']+' | '+row['category']+'</li>' +
        '<li>'+row['tag']+'</li>' +
        '</ul></a></div>');
  }
}

function advanced_search() {
  var criteria = {};
  $('#advanced_search').find('.glyphicon-ok-sign').each(function(){
    if (!$(this).hasClass("grey")){
      var name = $(this).attr('name');
      criteria[name] = '-1';
    }
  });
  $('#advanced_search').find('.glyphicon-remove-sign').each(function(){
    if (!$(this).hasClass("grey")){
      var name = $(this).attr('name');
      criteria[name] = '-2';
    }
  });
  $('#advanced_search').find('.glyphicon-ok').each(function(){
    var name = $(this).attr('name');
    var value = $(this).attr('value');
    if (criteria[name] == undefined) {
      criteria[name] = value;
    } else if (criteria[name] != '-1' && criteria[name] != '-2') {
      criteria[name] = criteria[name] + ',' + value;
    }
  });
  var cd = ['search_type','search_category','search_tag'];
  for (var i=0; i<cd.length; i++){
    if (criteria[cd[i]] == undefined)
      criteria[[cd[i]]] = '-2';
  }
  if (criteria['search_source']==undefined && criteria['search_chapter']==undefined){
    criteria['search_chapter'] = '-2';
  }
  url = END_POINT + "search?";
  for (var name in criteria){
    url = url + name.replace('search_','') + "=" + criteria[name] + "&";
  }
  if ($('#advanced_search').find('.glyphicon-heart').hasClass("red")){
    url = url + "fav=1&";
  }
  if (url[url.length-1] == '&')
    url = url.slice(0, -1);


  var headers = null;
  if (localStorage.getItem('token'))
    headers = {'Authorization':'Token '+localStorage.getItem('token')};
  $.ajax({
      url: url,
      type: 'GET',
      headers:headers,
      success: function(responseData) {
        localStorage.setItem("online",true);
        if (responseData['responseCode']=='000000') {
          $('.tab-button').removeClass('active');

          var $tab = $('#tab-content');
          $tab.empty();
          $("#tab-footer").empty();

          var $projectTemplate = null;
          $("#tab-content").load("./views/list-view.html", function() {
              set_list(responseData['records']);
          });
        }
        $('.mfp-close').click();
      },
      error: function(xmlhttprequest, textstatus, message) {
        if (localStorage.getItem("online")=="true") {
          localStorage.setItem("online",false);
          $('#show-message-dialog').click();
          $('#message-title').text("Error");
          $('#message-content').text("Connection Error. Use local data instead.");
        }
        var type = [];
        var category = [];
        var tag = [];
        var source = [];
        var chapter = [];
        var params = [type,category,tag,source,chapter];
        var keys = ['type','category','tag','source','chapter'];
        for (var i=0; i<keys.length; i++) {
          $('span[name="search_'+keys[i]+'"]').each(function(){
            if ($(this).hasClass("glyphicon-ok")){
              if ($(this).val() == '-1'){
                params[i] = null;
                return false;
              } else {
                params[i].append($(this).text());
              }
            }
          });
        }
        controller.storageService.getInventories(type,category,tag,source,chapter,null,function(rs){
          $('.tab-button').removeClass('active');
          var $tab = $('#tab-content');
          $tab.empty();
          $("#tab-footer").empty();
          var $projectTemplate = null;
          $("#tab-content").load("./views/list-view.html", function() {
              set_list_local(rs);
          });
        });
      }

  });
}

function back_to_list() {
  $("#list-view").css("display","block");
  $("#detail-view").css("display","none");
}

function get_detail_local(id) {
  controller.storageService.getDetail(id,function(list){
    $('#detail-id').val(list['id']);
    $('#detail-name').html(list['name']);
    $('#detail-type').html('<span>Type : </span>'+list['inventory_type']);
    $('#detail-category').html('<span>Category : </span>'+list['category']);
    $('#detail-tags').html('<span>Tags : </span>'+list['tag']);
    $('#detail-source').html('<span>Source : </span>'+list['source_name']);
    $('#detail-author').html('<span>Author : </span>'+list['source_author']);
    $('#detail-chapter').html('<span>Chapter : </span>'+list['chapter_name']);
    $('#detail-description').html(list['description']);
    $('.notetext').html(list['privatenote_note']);
    if (list['isfavorite']==1){
      $('.glyphicon-heart').addClass('red');
    }
    $("#list-view").css("display","none");
    $("#detail-view").css("display","block");
  });
}

function get_detail(iid){
  var headers = null;
  if (localStorage.getItem('token'))
    headers = {'Authorization':'Token '+localStorage.getItem('token')};
  $.ajax({
      url: END_POINT + 'detail/'+iid,
      type: 'GET',
      headers: headers,
      success: function(responseData) {
        if (responseData['responseCode']=='000000') {
            console.log(responseData);
            var list = responseData['records'];
            var t = '';
            var tags = list['tag'];
            if (tags.length > 0) {
              for (var i=0; i<tags.length-1; i++)
                t = t + tags[i]['name'] + ", ";
              t = t + tags[tags.length-1]['name'];
            }
            $('#detail-id').val(list['id']);
            $('#detail-name').html(list['name']);
            $('#detail-type').html('<span>Type : </span>'+list['inventory_type']);
            $('#detail-category').html('<span>Category : </span>'+list['category']);
            $('#detail-tags').html('<span>Tags : </span>'+t);
            $('#detail-source').html('<span>Source : </span>'+list['source_chapter']['source']['name']);
            $('#detail-author').html('<span>Author : </span>'+list['source_chapter']['source']['author']);
            $('#detail-chapter').html('<span>Chapter : </span>'+list['source_chapter']['name']);
            $('#detail-description').html(list['description']);
            $('.notetext').html(responseData['privatenote']['note']);
            $('.writing-comment').html(localStorage.getItem("username")+" is writing...");
            comments = responseData['comments']
            for (var i=0; i<comments.length; i++){
              $('#comments-div').after(
    					  '<p class="comment-info">'+comments[i]['username']+' wrote in '+comments[i]['create_time']+'</p>' +
    						'<p class="comment-content">'+comments[i]['note']+'</p>'
              );
            }
            if (responseData['isfavorite']==1){
              $('.glyphicon-heart').addClass('red');
            }
            $("#list-view").css("display","none");
            $("#detail-view").css("display","block");
        }
      },
  });
}

function change_favorite(el) {
  inv_id = $('#detail-id').val();
  if (localStorage.getItem('token')){
    var headers = {'Authorization':'Token '+localStorage.getItem('token'),};
    $.ajax({
        url: END_POINT + 'change_favorite?inv_id='+inv_id,
        headers: {
            'Authorization':'Token '+localStorage.getItem('token'),
        },
        type: 'GET',
        success: function(responseData) {
          if (responseData['message'] == "removed"){
            $(el).removeClass('red');
          } else if (responseData['message'] == "added"){
            $(el).addClass('red');
          }
        },
    });
  } else {
    $('#show-signin-dialog').click();
  }
}

function save(el) {
  var name = $('#detail-name').text();
  var description = $("#detail-description").text();
  var inventory_type = $("#detail-type").contents().filter(function(){return this.nodeType == 3;}).text();
  var category = $("#detail-category").contents().filter(function(){return this.nodeType == 3;}).text();
  var tag = $("#detail-tags").contents().filter(function(){return this.nodeType == 3;}).text();
  var source_name = $("#detail-source").contents().filter(function(){return this.nodeType == 3;}).text();
  var source_author = $("#detail-author").contents().filter(function(){return this.nodeType == 3;}).text();
  var chapter_name = $("#detail-chapter").contents().filter(function(){return this.nodeType == 3;}).text();
  var privatenote_note = $(".notetext").text();
  var favorite = 0;
  if ($("#favorite-icon").hasClass("red")) favorite = 1;
  controller.storageService.addInventory(name, description, category, inventory_type,
                                  tag,chapter_name,0,source_name,
                                  source_author,privatenote_note,favorite,function(saved){
    if (saved == "ok"){
      $('#show-message-dialog').click();
      $('#message-title').text("Success");
      $('#message-content').text("Data saved.");
    } else {
      $('#show-message-dialog').click();
      $('#message-title').text("Error");
      $('#message-content').text("Something went wrong. Please try again later."+saved);
    }
  });

}

function redirect_signin() {
  var next = window.location.pathname + window.location.search;
  $('#next').val(next);
  $('#show-signin-dialog').click();
}

function show_note(el) {
  $(el).closest(".inventory-display").find(".note-ul").slideToggle("250");
}

function show_comment(el) {
  $(el).closest(".inventory-display").find(".comment-ul").slideToggle("250");
}

function search_fav(el) {
  var i = $(el).find('.glyphicon-heart');
  if (i.hasClass("grey")) {
    i.removeClass("grey")
         .addClass("red");
  } else if (i.hasClass("red")) {
    i.removeClass("red")
         .addClass("grey");
  }
}

function edit_note(el) {
  iid = $('#detail-id').val();
  if ($(el).hasClass("glyphicon-pencil")) {
    $(el).closest('.note-ul').find('.notetext').prop('contenteditable', true);
    $(el).removeClass("glyphicon-pencil")
         .addClass("glyphicon-ok");
  } else if ($(el).hasClass("glyphicon-ok")) {
    var note = $(el).closest('.note-ul').find('.notetext').text();
    if (localStorage.getItem('token')){
      var headers = {'Authorization':'Token '+localStorage.getItem('token')};
      $.ajax({
          url: END_POINT + 'edit_note',
          headers: headers,
          type: 'POST',
          data: {
            iid:iid,
            note:note
          },
      });
      $(el).closest('.note-ul').find('.notetext').prop('contenteditable', false);
      $(el).removeClass("glyphicon-ok")
           .addClass("glyphicon-pencil");
     } else {
       $('#show-signin-dialog').click();
     }

  }
}

function add_comment(el) {
  iid = $('#detail-id').val();
  if ($(el).hasClass("glyphicon-plus")) {
    $(el).closest('.comment-ul').find('.add-comment').each(function(){
      $(this).slideToggle("250");
    });
    $(el).removeClass("glyphicon-plus")
         .addClass("glyphicon-ok");
  } else if ($(el).hasClass("glyphicon-ok")) {
    var note = $(el).closest('.comment-ul').find('.commenttext').text();
    if (note.length > 0) {
      if (localStorage.getItem('token')){
        var headers = {'Authorization':'Token '+localStorage.getItem('token')};
        var username = localStorage.getItem('username');
        $.ajax({
            url: END_POINT + 'add_comment',
            headers: headers,
            type: 'POST',
            data: {
              iid:iid,
              note:note
            },
        });
        var dt = new Date();
        var curr = dt.getFullYear() + "/" +(1+dt.getMonth()) + "/" + dt.getDate() + "/" + dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
        $(el).closest('.comment-ul').find('.writing-comment').before(
          "<p class='comment-info'>"+username+" wrote in "+ curr +"</p>" +
          "<p class='comment-content'>"+note+"</p>"
        );
      }
      $(el).closest('.comment-ul').find('.add-comment').each(function(){
        $(this).slideToggle("250");
      });
      $(el).removeClass("glyphicon-ok")
           .addClass("glyphicon-plus");
     } else {
       $('#show-signin-dialog').click();
     }
  }
}

function show_check_in() {
  iid = $('#detail-id').val();
  $('#checkin-iid').val(iid);
  $('#show-checkin-dialog').click();
}

function check_in(){
  var checkin_date = $('#datepicker').val();
  var hour_select = $('#hour-select').val();
  var minute_select = $('#minute-select').val();
  var checkin_length = $('#checkin-length').val();
  var checkin_iid  = $('#detail-id').val();
  if (localStorage.getItem('token')){
    var headers = {'Authorization':'Token '+localStorage.getItem('token')};
    $.ajax({
        url: END_POINT + 'check_in',
        type: 'POST',
        headers: headers,
        data: {
          checkin_time : checkin_date+" "+hour_select+":"+minute_select+":00",
          length : checkin_length,
          iid : checkin_iid
        },
    });
    $('.mfp-close').click();
  } else {
    $('#show-signin-dialog').click();
  }
}

function validateUsername(){
  var username = document.getElementById("username");
  if ($('.mfp-container').css('content')=='normal'){
    $.ajax({
        url: end_point + '/check_username?username='+username.value,
        type: 'GET',
        success: function(responseData) {
          if (responseData['code'] == "ok"){
            username.setCustomValidity('');
          } else {
            username.setCustomValidity("User name exists");
          }

        },
        error: function(xmlhttprequest, textstatus, message) {
          username.setCustomValidity("Server error. Please try again later.");
        }
    });
  }
}

function validateEmail(){
  var email = document.getElementById("email");
  if ($('.mfp-container').css('content')=='normal'){
    $.ajax({
        url: end_point + '/check_email?email='+email.value,
        type: 'GET',
        success: function(responseData) {
          if (responseData['code'] == "ok"){
            email.setCustomValidity('');
          } else {
            email.setCustomValidity("Email exists");
          }

        },
        error: function(xmlhttprequest, textstatus, message) {
          email.setCustomValidity("Server error. Please try again later.");
        }
    });
  }
}

function validatePassword(){
  var password = document.getElementById("password");
  var confirm_password = document.getElementById("confirm_password");
  if(password.value != confirm_password.value) {
    confirm_password.setCustomValidity("Passwords Don't Match");
  } else {
    confirm_password.setCustomValidity('');
  }
}

function set_source_select(data){
  $('#source-select').empty();
  for(var i=0; i<data.length; i++)
    $('#source-select').append('<option value="'+data[i]['id']+'">'+data[i]['name']+'</option>');
  $('#source-select').prepend('<option value="-1" selected>All Source</option>');
}

function set_source(data, offline=false) {
  for(var i=0; i<data.length; i++)
    $('#source-ul').append('<li class="search-arrow source-li has-sub"><div class="has-sub-wrap" id="source-'+data[i]['id']+'"><span name="search_source" value="'+data[i]['id']+'" class="glyphicon glyphicon-forward grey search-arrow" aria-hidden="true"></span>'+data[i]['name']+'</div></li>');
  $(".has-sub-wrap").click(function() {
    if ($(this).find('span').hasClass("grey")) {
      $(this).find('span').removeClass("grey");
      var ul = $(this).closest('li').find('ul');
      if (ul.length == 0) {
        var list = $(this).closest('li').append('<ul style="display:block !important;"></ul>').find('ul');
        var source_id = this.id.replace('source-','');
        var selected_all = "";
        var selected_none = "grey ";
        if (!($("#none-source").find('span').hasClass('grey'))){
            selected_all = "grey ";
            selected_none = "";
        }
        list.append('<li class="chapter-all-li" style="margin-left:30px"><span name="search_source" value="'+source_id+'" class="glyphicon glyphicon-ok-sign '+selected_all+'search-arrow" aria-hidden="true"></span>All Chapters</li>');
        list.append('<li class="chapter-none-li" style="margin-left:30px"><span name="search_source" value="--'+source_id+'" class="glyphicon glyphicon-remove-sign '+selected_none+'search-arrow" aria-hidden="true"></span>None Chapters</li>');
        if (offline==false) {
          $.ajax({
              url: end_point + '/chapter_list?sid='+(this.id.replace("source-","")),
              type: 'GET',
              success: function(responseData) {
                set_chapter(responseData["data"], list);
              },
              error: function(xmlhttprequest, textstatus, message) {
                $('#show-message-dialog').click();
                $('#message-title').text("Connection Error");
                $('#message-content').text("Something went wrong. Please try again later.");
              }
          });
        } else {
            controller.storageService.getChapter($(this).text(),function(cp) {
            set_chapter(cp,list);
          });
        }
      } else {
        ul.slideToggle("250");
      }
    } else {
      if ($(this).closest('li').find('ul').length > 0)
          $(this).closest('li').find('ul').slideToggle("250");
      $(this).find('span').addClass("grey");
    }
  });
}

function set_chapter(data, list) {
  for(var i=0; i<data.length; i++){
    if (!($("#none-source").find('span').hasClass('grey')))
      list.append('<li class="chapter-li" style="margin-left:30px"><span name="search_chapter" value="'+data[i]['id']+'" class="glyphicon glyphicon-triangle-top search-arrow" aria-hidden="true"></span>'+data[i]['name']+'</li>');
    else
      list.append('<li class="chapter-li" style="margin-left:30px"><span name="search_chapter" value="'+data[i]['id']+'" class="glyphicon glyphicon-ok search-arrow" aria-hidden="true"></span>'+data[i]['name']+'</li>');
  }
}
