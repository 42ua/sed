 "use strict";

$(function() {

  (function() {

    function b64DecodeUnicode(str) {
      return decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
    }

    var b64lastElement = null;

    function b64DecodeUserFriendly(str) {
      if (b64lastElement) {
        b64lastElement.remove();
        b64lastElement = null;
      }
      try {
        return b64DecodeUnicode(str);
      } catch (err) {
        b64lastElement = 
          $("<div class='alert alert-warning'>" +
          "<strong>Warning!</strong> base64 parse problem</div>"
        ).appendTo(".user-errors-here");
        throw err;
      }
    }

    var parseId, cacheInput, cacheArgs;

    function parse() {
      if (parseId) {
        clearTimeout(parseId);
      }

      parseId = setTimeout(function () {
        var input = b64DecodeUserFriendly($("#sed-base64-stdin").val()),
            args = $("#sed-cmd").val();
        if (cacheInput !== input || cacheArgs !== args){
          cacheInput = input;
          cacheArgs = args;
          $("#sed-stdin").val(input);
          $("#sed-stdout").val(fn_gnu_sed(input, args).replace(/\n$/, ""));
        }
      }, 333);
    }

    $("#sed-base64-stdin").on('keyup input', parse);
    $("#sed-cmd").on('keyup input', parse);

  })();

  /* options */

  (function() {
    $(".sed-options.dropdown-menu li a").click(function() {
      var val = $(this).text();
      var newVal = ['--help', '--version'].indexOf(val) > -1 
        ? val
        : val + ' ' + $("#sed-cmd").val();
      $("#sed-cmd").val(newVal).keyup();
    });
  })();

  /* Gist API */

  (function() {
    $("li a.gist-api").click(function() {
      $.ajax({
        type: "POST",
        url: 'https://api.github.com/gists',
        headers: {
          "Authorization": 'Basic bWF6a29ib3Q6MWY1ZjAxODgzNTQzMjU4Yjc5NjdjNmYzODcxZmI0NDIzZDRiM2E0MA==',
        },
        data: JSON.stringify({
          "description": "sed.js",
          "files": {
            "stdin": {"content": $("#sed-base64-stdin").val()},
            "stdout": {"content": $("#sed-stdout").val()},
            "args": {"content": $("#sed-cmd").val()}
          }
        })
      }).done(function(response) {
        var url = response.html_url,
            my = $(location).attr('href').replace(/(#|\?).*$/, "") + '?gist=' + response.id;
        $(".user-errors-here").append( "<div class='alert alert-success alert-dismissible fade in' role=alert>" + 
          "<button type=button class=close data-dismiss=alert aria-label=Close><span aria-hidden=true>&times;</span></button>" + 
          "<strong>GIST:</strong> <a href='" + url + "'>" + response.id + "</a> | " + 
          "<strong>Share:</strong> <a href='" + my + "'>me</a>" + 
          "</div>"
        );
      }).fail(function( e ) {
        $(".user-errors-here").append( "<div class='alert alert-danger alert-dismissible fade in' role=alert>" + 
          "<button type=button class=close data-dismiss=alert aria-label=Close><span aria-hidden=true>&times;</span></button>" + 
          "<strong>Holy guacamole!</strong> " + [e.status, e.statusText] + "</div>"
        );
      });
    });
  })();

});

/* Gist load or default */

(function() {
  function getParameterByName(name, url) {
      if (!url) url = window.location.href;
      name = name.replace(/[\[\]]/g, "\\$&");
      var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
          results = regex.exec(url);
      if (!results) return null;
      if (!results[2]) return '';
      return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  var gistId = getParameterByName('gist') || 'f50c4efa3705af4cffdedfd196ad1153',
      stdinGist = getParameterByName('stdin') || 'stdin',
      argsGist = getParameterByName('args') || 'args',
      doc_ready = $.Deferred();

  /* http://stackoverflow.com/q/10326398 */

  $(doc_ready.resolve);

  $.when( 
    $.get( 'https://api.github.com/gists/' + gistId),
    doc_ready )
  .then(function( data ) {
    var args = data[0].files[argsGist].content, 
        rows = args.split(/\r\n|\r|\n/).length,
        stdin = data[0].files[stdinGist].content;
    $("#sed-cmd").val(args).attr("rows", rows).css({"height": rows > 1 ? "auto" : "34px"});
    // document.ready() callbacks are called in the order they were registered. 
    // If you register your testing callback first, it will be called first
    // keyup() listener is registered earlier in this file
    $("#sed-base64-stdin").val(stdin).keyup();
  })
  .fail(function( e ) {
    $(".user-errors-here").append( "<div class='alert alert-danger alert-dismissible fade in' role=alert>" + 
      "<button type=button class=close data-dismiss=alert aria-label=Close><span aria-hidden=true>&times;</span></button>" + 
      "<strong>Holy guacamole!</strong> " + [e.status, e.statusText] + "</div>"
    );
  });

})();