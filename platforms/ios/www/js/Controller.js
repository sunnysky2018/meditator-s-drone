
function redirectForm(e, el_, callback, ep=END_POINT) {
  e.preventDefault();
  var url = ep + $(el_).attr('action');
  var data = $(el_).serialize();
  var method = $(el_).attr('method');
  var el = $(el_);
  headers = null;
  if (localStorage.getItem('token'))
    headers = {'Authorization':'Token '+localStorage.getItem('token')};

  $.ajax({
    url: url,
    data: data,
    headers: headers,
    type: method,
    timeout: 30000,
    success: function(responseData) {
      // $('#'+responseData['tab']).click();
      callback(responseData);
    },
    error: function(xmlhttprequest, textstatus, message) {
      $('#show-message-dialog').click();
      $('#message-title').text("Submited");
      $('#message-content').text("Something went wrong. Please try again later.");
    }
  });
}

var Controller = function() {
    var controller = {
        initialize: function() {
          self = this;
          new SQLiteStorageService().done(function(service) {
              self.storageService = service;
              self.bindEvents();
              self.renderIndexView();
          }).fail(function(error) {
              alert(error);
          });
        },

        bindEvents: function() {
            $('.popup-with-zoom-anim').magnificPopup({
              type: 'inline',
              fixedContentPos: false,
              fixedBgPos: true,
              overflowY: 'auto',
              closeBtnInside: true,
              preloader: false,
              midClick: true,
              removalDelay: 300,
              mainClass: 'my-mfp-zoom-in'
            });

            $('.tab-button').on('click', this.onTabClick);

            $(".list-item").click(function() {
              $("#list-item-button").click();
            });

            $("#login-li").click(function(){
              localStorage.setItem('next','account');
            });

            $(".scroll").click(function(event){
              event.preventDefault();
              $('html,body').animate({scrollTop:$(this.hash).offset().top},1000);
            });

            $(".btn-nav").on("click tap", function() {
              $(".nav-container").toggleClass("showNav hideNav").removeClass("hidden");
              $(this).toggleClass("animated");
            });

            $(".construction").click(function(event) {
              event.preventDefault();
              $('#message-title').text("Coming soon");
              $('#message-content').text("This part is in construction. Thank you for visiting.");
              $('#show-message-dialog').click();
            });

            if (localStorage.getItem("token") == null){
              $("#login-li").css('display','block');
              $("#account-li").css('display','none');
            } else {
              $("#account-li").css('display','block');
              $("#login-li").css('display','none');
            }

            $('#kwsearch-form').on('submit', function(e){
              e.preventDefault();
              var url = END_POINT + $(this).attr('action');
              var data = $(this).serialize();
              var method = $(this).attr('method');
              headers = null;
              if (localStorage.getItem('token'))
                headers = {'Authorization':'Token '+localStorage.getItem('token')};
              $.ajax({
                url: url,
                data: data,
                headers: headers,
                type: method,
                timeout: 30000,
                success: function(responseData) {
                  localStorage.setItem("online",true);
                  if (responseData['responseCode']=='000000') {
                    $('.tab-button').removeClass('active');
                    var $tab = $('#tab-content');
                    $tab.empty();
                    $("#tab-footer").empty();
                    $("#tab-content").load("./views/list-view.html", function() {
                        set_list(responseData['records']);
                    });
                  }
                },
                error: function(xmlhttprequest, textstatus, message) {
                  if (localStorage.getItem("online")=="true"){
                    localStorage.setItem("online",false);
                    $('#show-message-dialog').click();
                    $('#message-title').text("Error");
                    $('#message-content').text("Connection Error. Use local data instead.");
                  }
                  storageService.getInventories(null,null,null,null,null,$('input[name="q"]').val(),function(rs){
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

            });
            $('#signin-form').on('submit', function(e){
              e.preventDefault();
              redirectForm(e, this, function(data){
                if (data['responseCode'] == '000000'){
                  localStorage.setItem('token',data['token']);
                  localStorage.setItem('email',data['email']);
                  localStorage.setItem('username',data['username']);
                  $("#account-li").css('display','block');
                  $("#login-li").css('display','none');
                  $(".mfp-close").click();
                  if (localStorage.getItem("next") != null){
                    $("#"+localStorage.getItem("next")+"-tab-button").click();
                    $("#list-item-button").click();
                    localStorage.removeItem("next");
                  }
                }
              });
            });
            $('#signup-form').on('submit', function(e){
              e.preventDefault();
              redirectForm(e, this, function(data){
                if (data['responseCode'] == '000000'){
                  $("#signup-form").trigger('reset');
                  localStorage.setItem('token',data['token']);
                  localStorage.setItem('email',data['email']);
                  localStorage.setItem('username',data['username']);
                  $("#account-li").css('display','block');
                  $("#login-li").css('display','none');
                  $(".mfp-close").click();
                  if (localStorage.getItem("next") != null){
                    $("#"+localStorage.getItem("next")+"-tab-button").click();
                    $("#list-item-button").click();
                    localStorage.removeItem("next");
                  }
                }
              });
            });
            /*
            $('.js-arrow').click(function (e) {
              e.preventDefault();
              if (this.id == 'source-h4') {
                var ul = $(this).next().find('ul');
                if (ul.length == 0) {
                  var list = $(this).next().append('<ul class="search-arrow" id="source-ul" style="display:block !important;"></ul>').find('ul');
                  var all_symbol = "glyphicon-ok";
                  if (getUrlParameter("source")!== undefined && getUrlParameter("source") != "-1")
                      all_symbol = "glyphicon-triangle-top";
                  list.append('<li class="search-arrow source-li source-li-all" id="all-source"><span name="search_source" value="-1" class="glyphicon '+all_symbol+' search-arrow" aria-hidden="true"></span>All Sources</li>');
                  list.append('<li class="search-arrow source-li source-li-none" id="none-source"><span name="search_source" value="-2" class="glyphicon glyphicon-remove search-arrow" aria-hidden="true"></span>None Sources</li>');
                  $("#all-source").click(function(){
                    if ($(this).find('span').hasClass("glyphicon-triangle-top")){
                      $(this).closest('ul').find('li').each(function(){
                        if ((!$(this).hasClass('has-sub')) && $(this).find('span').hasClass("glyphicon-triangle-top")){
                            $(this).find('span').removeClass("glyphicon-triangle-top")
                                    .addClass("glyphicon-ok");
                        }
                      });
                      $(this).find('span').removeClass("glyphicon-triangle-top")
                             .addClass("glyphicon-ok");
                    } else if ($(this).find('span').hasClass("glyphicon-ok")) {
                      $(this).find('span').removeClass("glyphicon-ok")
                             .addClass("glyphicon-triangle-top");
                    }
                  });
                  $("#none-source").click(function(){
                    $(this).closest('ul').find('li').each(function(){
                      if ((!$(this).hasClass('has-sub')) && $(this).find('span').hasClass("glyphicon-ok")){
                          $(this).find('span').removeClass("glyphicon-ok")
                                  .addClass("glyphicon-triangle-top");
                      }
                    });
                  });
                  $.ajax({
                      url: end_point + '/source_list/',
                      type: 'GET',
                      success: function(responseData) {
                        localStorage.setItem("online",true);
                        set_source(responseData["data"]);
                      },
                      error: function(xmlhttprequest, textstatus, message) {
                        if (localStorage.getItem("online")=="true"){
                          localStorage.setItem("online",false);
                          $('#show-message-dialog').click();
                          $('#message-title').text("Connection Error");
                          $('#message-content').text("Something went wrong. Using local data.");
                        }
                        self.storageService.getSource(function(sc) {
                          set_source(sc, offline=true);
                        });
                      }
                  });
                } else {
                  ul.slideToggle("250");
                }
              }
              $(this).find(".arrow").toggleClass("up");
              $(this).toggleClass("open");
              $(this).parent().find('.js-sub-list').slideToggle("250");
            });
            */

            // search modal
            $('.js-sub-list').hide();
            $('#chapter').hide();
            $('.no-sub').on('click','li',function(e) {
              if ($(this).hasClass("all-li")){
                if($(this).find('span').hasClass("grey")) {
                  $(this).find('span').removeClass("grey");
                  $(this).closest('ul').find('span').each(function(){
                    if ($(this).hasClass("glyphicon-triangle-top")){
                      $(this).removeClass("glyphicon-triangle-top")
                             .addClass("glyphicon-ok");
                    } else if ($(this).hasClass("glyphicon-remove-sign") && (!($(this).hasClass("grey")))) {
                      $(this).addClass("grey");
                    } else if ($(this).hasClass("glyphicon-ok-sign") && $(this).hasClass("grey")){
                      $(this).removeClass("grey");
                    }
                  });
                }
              } else if ($(this).hasClass("none-li")) {
                if($(this).find('span').hasClass("grey")) {
                  $(this).find('span').removeClass("grey");
                  $(this).closest('ul').find('span').each(function(){
                    if ($(this).hasClass("glyphicon-ok")){
                      $(this).removeClass("glyphicon-ok")
                             .addClass("glyphicon-triangle-top");
                    } else if ($(this).hasClass("glyphicon-ok-sign") && (!($(this).hasClass("grey")))) {
                      $(this).addClass("grey");
                    } else if ($(this).hasClass("glyphicon-remove-sign") && (($(this).hasClass("grey")))) {
                      $(this).removeClass("grey");
                    }
                  });
                }
              } else if ($(this).find('span').hasClass("glyphicon-triangle-top")) {
                $(this).find('span').removeClass("glyphicon-triangle-top")
                                    .addClass("glyphicon-ok");
                var non = $(this).closest('ul').find('.none-li').find('span');
                if (!non.hasClass("grey")) {
                  non.addClass("grey");
                }
              } else if ($(this).find('span').hasClass("glyphicon-ok")) {
                $(this).find('span').removeClass("glyphicon-ok")
                                    .addClass("glyphicon-triangle-top");
                var all = $(this).closest('ul').find('.all-li').find('span');
                if (!all.hasClass("grey")) {
                  all.addClass("grey");
                }
              }
            });

            $('#all-source').click(function(){
              if($(this).find('span').hasClass("grey")) {
                $(this).find('span').removeClass("grey");
                $(this).closest('ul').find('span').each(function(){
                  if ($(this).hasClass("glyphicon-triangle-top")){
                    $(this).removeClass("glyphicon-triangle-top")
                           .addClass("glyphicon-ok");
                  } else if ($(this).hasClass("glyphicon-remove-sign") && (!($(this).hasClass("grey")))) {
                    $(this).addClass("grey");
                  } else if ($(this).hasClass("glyphicon-ok-sign") && $(this).hasClass("grey")){
                    $(this).removeClass("grey");
                  }
                });
              }
            });

            $('#none-source').click(function(){
              if($(this).find('span').hasClass("grey")) {
                $(this).find('span').removeClass("grey");
                $(this).closest('ul').find('span').each(function(){
                  if ($(this).hasClass("glyphicon-ok")){
                    $(this).removeClass("glyphicon-ok")
                           .addClass("glyphicon-triangle-top");
                  } else if ($(this).hasClass("glyphicon-ok-sign") && (!($(this).hasClass("grey")))) {
                    $(this).addClass("grey");
                  } else if ($(this).hasClass("glyphicon-remove-sign") && (($(this).hasClass("grey")))) {
                    $(this).removeClass("grey");
                  }
                });
              }
            });

            $('#source-ul').on('click','.chapter-all-li',function(){
              if($(this).find('span').hasClass("grey")) {
                $(this).find('span').removeClass("grey");
                $(this).closest('ul').find('span').each(function(){
                  if ($(this).hasClass("glyphicon-triangle-top")){
                    $(this).removeClass("glyphicon-triangle-top")
                           .addClass("glyphicon-ok");
                  } else if ($(this).hasClass("glyphicon-remove-sign") && (!($(this).hasClass("grey")))) {
                    $(this).addClass("grey");
                  } else if ($(this).hasClass("glyphicon-ok-sign") && $(this).hasClass("grey")){
                    $(this).removeClass("grey");
                  }
                });
                if (!$('#none-source').find('span').hasClass('grey'))
                  $('#none-source').find('span').addClass('grey');
              }
            });

            $('#source-ul').on('click','.chapter-none-li',function(){
              if($(this).find('span').hasClass("grey")) {
                $(this).find('span').removeClass("grey");
                $(this).closest('ul').find('span').each(function(){
                  if ($(this).hasClass("glyphicon-ok")){
                    $(this).removeClass("glyphicon-ok")
                           .addClass("glyphicon-triangle-top");
                  } else if ($(this).hasClass("glyphicon-ok-sign") && (!($(this).hasClass("grey")))) {
                    $(this).addClass("grey");
                  } else if ($(this).hasClass("glyphicon-remove-sign") && (($(this).hasClass("grey")))) {
                    $(this).removeClass("grey");
                  }
                });
                if (!$('#all-source').find('span').hasClass('grey'))
                  $('#all-source').find('span').addClass('grey');
              }
            });

            $('#source-ul').on('click','.chapter-li', function(){
              if ($(this).find('span').hasClass("glyphicon-triangle-top")) {
                $(this).find('span').removeClass("glyphicon-triangle-top")
                                    .addClass("glyphicon-ok");
                var non = $(this).closest('ul').find('.chapter-none-li').find('span');
                if (!non.hasClass("grey")) {
                  non.addClass("grey");
                }
                if (!$('#none-source').find('span').hasClass('grey'))
                  $('#none-source').find('span').addClass('grey');
              } else if ($(this).find('span').hasClass("glyphicon-ok")) {
                $(this).find('span').removeClass("glyphicon-ok")
                                    .addClass("glyphicon-triangle-top");
                var all = $(this).closest('ul').find('.chapter-all-li').find('span');
                if (!all.hasClass("grey")) {
                  all.addClass("grey");
                }
                if (!$('#all-source').find('span').hasClass('grey'))
                  $('#all-source').find('span').addClass('grey');
              }
            });

            $('.js-arrow').click(function (e) {
              e.preventDefault();
              if (this.id == 'source-h4') {
                var ul = $(this).next().find('ul');
                var li = ul.find('li');
                if (li.length <= 2) {
                  var list = $(this).next().find('ul');
                  $.ajax({
                      url: end_point + '/source_list/',
                      type: 'GET',
                      success: function(responseData) {
                        localStorage.setItem("online",true);
                        set_source(responseData["data"]);
                      },
                      error: function(xmlhttprequest, textstatus, message) {
                        if (localStorage.getItem("online")=="true"){
                          localStorage.setItem("online",false);
                          $('#show-message-dialog').click();
                          $('#message-title').text("Connection Error");
                          $('#message-content').text("Something went wrong. Using local data.");
                        }
                        self.storageService.getSource(function(sc) {
                          set_source(sc, offline=true);
                        });
                      }
                  });
                } else {
                  ul.slideToggle("250");
                }
              }
              $(this).find(".arrow").toggleClass("up");
              $(this).toggleClass("open");
              $(this).parent().find('.js-sub-list').slideToggle("250");
            });

            /*
            $('#source-div').click(function(e) {
              var t = $(e.target);
              if (t.hasClass('chapter-li')){
                if (t.find('span').hasClass('glyphicon-triangle-top')){
                  t.find('span').removeClass('glyphicon-triangle-top')
                                      .addClass('glyphicon-ok');
                } else if (t.find('span').hasClass('glyphicon-ok')){
                  t.find('span').removeClass('glyphicon-ok')
                                      .addClass('glyphicon-triangle-top');
                  if (t.closest('ul').find('.chapter-li-all').find('span').hasClass('glyphicon-ok'))
                    t.closest('ul').find('.chapter-li-all').find('span').removeClass('glyphicon-ok')
                                                                             .addClass('glyphicon-triangle-top');
                  if ($('.source-li-all').find('span').hasClass('glyphicon-ok'))
                    $('.source-li-all').find('span').removeClass('glyphicon-ok')
                                                    .addClass('glyphicon-triangle-top');
                }
              } else if (t.hasClass('chapter-li-all')) {
                if (t.find('span').hasClass('glyphicon-triangle-top')){
                  t.find('span').removeClass('glyphicon-triangle-top')
                                      .addClass('glyphicon-ok');
                  t.closest('ul').find('li').each(function(){
                    if ($(this).find('span').hasClass('glyphicon-triangle-top'))
                        $(this).find('span').removeClass('glyphicon-triangle-top')
                                      .addClass('glyphicon-ok');
                  });
                } else if (t.find('span').hasClass('glyphicon-ok')){
                  t.find('span').removeClass('glyphicon-ok')
                                      .addClass('glyphicon-triangle-top');
                  if ($('.source-li-all').find('span').hasClass('glyphicon-ok'))
                      $('.source-li-all').find('span').removeClass('glyphicon-ok')
                                                      .addClass('glyphicon-triangle-top');
                }
              } else if (t.hasClass('chapter-li-none')) {
                t.closest('ul').find('li').each(function(){
                  if ($(this).find('span').hasClass('glyphicon-ok'))
                      $(this).find('span').removeClass('glyphicon-ok')
                                    .addClass('glyphicon-triangle-top');
                });
                if ($('.source-li-all').find('span').hasClass('glyphicon-ok'))
                  $('.source-li-all').find('span').removeClass('glyphicon-ok')
                                                  .addClass('glyphicon-triangle-top');
              }
            });
            */

            document.getElementById("username").onchange = validateUsername;
            document.getElementById("email").onkeyup = validateEmail;
            document.getElementById("password").onchange = validatePassword;
            document.getElementById("confirm_password").onchange = validatePassword;


        },

        onTabClick: function(e) {
            e.preventDefault();
            if ($(this).hasClass('active')) {
                return;
            }

            var tab = $(this).data('tab');
            if (tab === '#index-tab') {
                self.renderIndexView();
            } else if (tab === '#account-tab') {
                self.renderAccountView();
            } else if (tab === '#search-tab') {
                self.renderSearchView();
            }
        },

        renderIndexView: function() {
            $('.tab-button').removeClass('active');
            $('#index-tab-button').addClass('active');

            var $tab = $('#tab-content');
            $tab.empty();
            $("#tab-content").load("./views/index-view.html", function(data) {
              $.ajax({
                  url: end_point + '/source_list/',
                  type: 'GET',
                  success: function(responseData) {
                    localStorage.setItem("online",true);
                    $('#source-select').removeClass('offline')
                                       .addClass('online');
                    set_source_select(responseData["data"]);
                  },
                  error: function(xmlhttprequest, textstatus, message) {
                    if (localStorage.getItem("online")=="true"){
                      localStorage.setItem("online",false);
                      $('#show-message-dialog').click();
                      $('#message-title').text("Connection Error");
                      $('#message-content').text("Something went wrong. Using local data.");
                    }
                    self.storageService.getSource(function(sc) {
                      $('#source-select').removeClass('online')
                                         .addClass('offline');
                      set_source_select(sc);
                    });
                  }
              });

              $('#basic-search-form').on('submit',function(e){
                e.preventDefault();

                var data = $(this).serialize();
                if ($("#chapter-select").val() == -1)
                  data = data.replace('&chapter=-1','');
                else if ($("#chapter-select").val() != null)
                  data = data.replace('&source='+$("#source-select").val(), '');
                var url = END_POINT + $(this).attr('action');
                var method = $(this).attr('method');
                headers = null;
                if (localStorage.getItem('token'))
                  headers = {'Authorization':'Token '+localStorage.getItem('token')};
                $.ajax({
                  url: url,
                  data: data,
                  headers: headers,
                  type: method,
                  timeout: 30000,
                  success: function(responseData) {
                    localStorage.setItem("online",true);
                    if (responseData['responseCode']=='000000') {
                      $('.tab-button').removeClass('active');
                      var $tab = $('#tab-content');
                      $tab.empty();
                      $("#tab-footer").empty();
                      $("#tab-content").load("./views/list-view.html", function() {
                          set_list(responseData['records']);
                      });
                    }
                  },
                  error: function(xmlhttprequest, textstatus, message) {
                    if(localStorage.getItem("online")=="true"){
                      localStorage.setItem("online",false);
                      $('#show-message-dialog').click();
                      $('#message-title').text("Error");
                      $('#message-content').text("Connection Error. Use local data instead.");
                    }
                    var type = [$('select[name="type"] option:selected').text()];
                    var category = [$('select[name="category"] option:selected').text()];
                    var tag = [$('select[name="tag"] option:selected').text()];
                    var source = [$('select[name="source"] option:selected').text()];
                    var chapter = [$('select[name="chapter"] option:selected').text()];
                    if ($('select[name="type"]').val() == '-1')
                      type = null;
                    if ($('select[name="category"]').val() == '-1')
                      category = null;
                    if ($('select[name="tag"]').val() == '-1')
                      tag = null;
                    if ($('select[name="source"]').val() == '-1') {
                      source = null;
                      chapter = null;
                    }
                    else if ($('select[name="chapter"]').val() == '-1' || chapter==null || chapter.length==0)
                      chapter = null;
                    else
                      source = null;
                    self.storageService.getInventories(type,category,tag,source,chapter,null,function(rs){
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
             });
            });
            $("#tab-footer").load("./views/index-foot-view.html", function(){
              $('#contact-form').submit(function(e){
                e.preventDefault();
                var url = $(this).attr('action');
                var data = $(this).serialize();
                var method = $(this).attr('method');
                var el = $(this);
                $.ajax({
                  url: END_POINT + url +"/",
                  data: data,
                  type: method,
                  timeout: 30000,
                  success: function(responseData) {
                    $('#show-message-dialog').click();
                    $('#message-title').text("Submited");
                    $('#message-content').text(responseData['message']);
                    el.trigger("reset");
                  },
                  error: function(xmlhttprequest, textstatus, message) {
                    $('#show-message-dialog').click();
                    $('#message-title').text("Submited");
                    $('#message-content').text("Something went wrong. Please try again later.");
                  }
                });
              });
            });

        },

        renderSearchView: function(data) {
            $('.tab-button').removeClass('active');
            $('#search-tab-button').addClass('active');

            var $tab = $('#tab-content');
            $tab.empty();
            $("#tab-footer").empty();

            var $projectTemplate = null;
            $("#tab-content").load("./views/search-view.html", function() {
                list = localStorage.getItem('search_result');
                for (var i=0; i<list.length; i++){
                }
            });

        },

        renderAccountView: function() {
            $('.tab-button').removeClass('active');
            $('#account-tab-button').addClass('active');

            var $tab = $('#tab-content');
            $tab.empty();
            $("#tab-footer").empty();

            var $projectTemplate = null;
            $("#tab-content").load("./views/account-view.html", function(data) {

              $('#checkin-h4').on('click', function(e){
                ul = $(this).closest('div').find('ul');
                if (ul.length>0){
                  ul.remove();
                }
                p = $(this).closest('div').find('p');
                if (p.length>0){
                  p.remove();
                }
                $.ajax({
                  url: END_POINT + 'account',
                  headers: {
                      'Authorization':'Token '+localStorage.getItem('token'),
                  },
                  type: 'GET',
                  timeout: 30000,
                  success: function(responseData) {
                    var list = responseData['records'];
                    if (list==undefined || list.length==0 ){
                      $("#checkin-div").append('<p>Oops, no check in</p>');
                    } else {
                      var ul = $("#checkin-div").append('<ul class="search-arrow" style="display:block !important;">').find('ul');
                      for (var i=0; i<list.length; i++){
                        var li_str = '<li class="checkin-li">'+
                                   '<div class="checkin-title"><span class="glyphicon glyphicon-bookmark" aria-hidden="true"></span>'+list[i]['inventory']['name']+'</div>' +
                                   '<div class="checkin-info">'+list[i]['checkin_time']+'</div>';
                        if (list[i]['length'] != null)
                          li_str = li_str + '<div class="checkin-info">'+list[i]['length']+' minutes</div>';
                        li_str = li_str + '</li>';
                        ul.append(li_str);
                      }
                    }
                  },
                  error: function(xmlhttprequest, textstatus, message) {
                    $('#show-message-dialog').click();
                    $('#message-title').text("Submited");
                    $('#message-content').text("Something went wrong. Please try again later.");
                  }
                });

                $(this).find(".arrow").toggleClass("up");
                $(this).toggleClass("open");
                $(this).parent().find('.js-sub-list').slideToggle("250");
              });

              $('#download-h4').on('click', function(e){
                ul = $(this).closest('div').find('ul');
                if (ul.length>0){
                  ul.remove();
                }
                p = $(this).closest('div').find('p');
                if (p.length>0){
                  p.remove();
                }
                controller.storageService.getAll(function(list){
                  if (list==undefined || list.length==0 ){
                    $("#download-div").append('<p>Oops, no saved method.</p>');
                  } else {
                    var ul = $("#download-div").append('<ul class="search-arrow" style="display:block !important;">').find('ul');
                    for (var i=0; i<list.length; i++){
                      var row = list.item(i);
                      var li_str = '<li class="download-li">'+
                                 '<div class="download-title">'+row['name']+'</div>' +
                                 '<div class="download-source grey">'+row["source_name"]+'</div>' +
                                 '<div class="download-author grey">'+row["source_author"]+'</div>' +
                                 '<div onclick=remove_by_id(this,'+row["id"]+')><span class="glyphicon glyphicon-trash" aria-hidden="true"></span></div>';

                      li_str = li_str + '</li>';
                      ul.append(li_str);
                    }
                  }
                });

                $(this).find(".arrow").toggleClass("up");
                $(this).toggleClass("open");
                $(this).parent().find('.js-sub-list').slideToggle("250");
              });

              $('#logout-a').on('click', function(e){
                $.ajax({
                  url: END_POINT + 'logout',
                  headers: {
                      'Authorization':'Token '+localStorage.getItem('token'),
                  },
                  type: 'GET',
                  timeout: 30000,
                  success: function(responseData) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('email',data['email']);
                    localStorage.removeItem('username',data['username']);
                    $("#login-li").css('display','block');
                    $("#account-li").css('display','none');
                    $("#index-tab-button").click();
                    $("#list-item-button").click();
                  },
                  error: function(xmlhttprequest, textstatus, message) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('email',data['email']);
                    localStorage.removeItem('username',data['username']);
                    $("#login-li").css('display','block');
                    $("#account-li").css('display','none');
                    $("#index-tab-button").click();
                    $("#list-item-button").click();
                  }
                });
              });
            });

        },


    }
    controller.initialize();
    return controller;
}
