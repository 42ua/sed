 "use strict";

(function() {

  var parseId;

  function id(i) {
      return document.getElementById(i);
  }
  function parse(delay) {
      if (parseId) {
          window.clearTimeout(parseId);
      }

      parseId = window.setTimeout(function () {
        var input = id("sed-stdin").value;
        var args = id("sed-cmd").value;
        var output = fn_gnu_sed(input, args);
        id("sed-stdout").value = output.replace(/\n$/, "");
      }, delay || 555);
  }
  window.onload = function () {
      var update = function() { parse(); };
      id("sed-stdin").onkeyup = update;
      id("sed-cmd").onkeyup = update;
      parse();
  };
})();

(function() {
  $(".sed-options.dropdown-menu li a").click(function() {
    var val = $(this).text();
    var newVal = ['--help', '--version'].indexOf(val) > -1 
      ? val
      : val + ' ' + $("#sed-cmd").val();
    $("#sed-cmd").val(newVal).keyup();
  });
})();

/* Gist */

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

  var user = getParameterByName('user') || 'anonymous',
    gistId = getParameterByName('gist') || '5ff713738952b2989abae18e72f1752e';

  if (user && gistId) {
    var stdinGist = getParameterByName('stdin') || 'stdin',
        argsGist = getParameterByName('args') || 'args';

    $.when( 
      $.get( 'https://gist.githubusercontent.com/' + user + '/' + gistId + '/raw/' + stdinGist ), 
      $.get( 'https://gist.githubusercontent.com/' + user + '/' + gistId + '/raw/' + argsGist ) )
    .then(function( stdin, args ) {
      var rows = args[0].split(/\r\n|\r|\n/).length;
      $("#sed-cmd").val(args[0]).attr("rows", rows).css({"height": rows > 1 ? "auto" : "34px"});
      $("#sed-stdin").val(stdin[0]).keyup();
    })
    .fail(function( e ) {
      $(".user-errors-here").append( "<div class='alert alert-danger alert-dismissible fade in' role=alert>" + 
        "<button type=button class=close data-dismiss=alert aria-label=Close><span aria-hidden=true>&times;</span></button>" + 
        "<strong>Holy guacamole!</strong> " + [e.status, e.statusText] + "</div>"
      );
    });
  }
})();

(function() {
  $("li a.gist-api").click(function() {
    $.post('https://api.github.com/gists', 
      JSON.stringify({
        "description": "sed.js",
        "files": {
          "stdin": {"content": $("#sed-stdin").val()},
          "args": {"content": $("#sed-cmd").val()}
        }
      })
    ).done(function(response) {
      var url = response.html_url,
          my = $(location).attr('href').replace(/#$/, "") + '?gist=' + response.id;
      $(".user-errors-here").append( "<div class='alert alert-success alert-dismissible fade in' role=alert>" + 
        "<button type=button class=close data-dismiss=alert aria-label=Close><span aria-hidden=true>&times;</span></button>" + 
        "<strong>GIST:</strong> <a href='" + url + "'>" + response.id + "</a> | " + 
        "<strong>Share:</strong> <a href='" + my + "'>me</a><br/>" + 
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