/*jslint browser: true*/
/*global cu */
/*global fu */
/*global app */

const cu = {}

cu.escapeHtml = function (raw) {
  var tagsToReplace = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
  }
  return raw && raw.replace(/[&<>'"]/g, tag => tagsToReplace[tag] || tag)
}

// this directive must have an id
// multi-line <textarea> with colored overlay
app.directive('anglishBox', ['$timeout', '$sce', function ($timeout, $sce) {
  const codePoints = ['\uE000', '\uE001', '\uE002', '\uE003', '\uE004', '\uE005', '\uE006', '\uE007', '\uE008', '\uE009', '\uE00a', '\uE00b', '\uE00c', '\uE00d', '\uE00e', '\uE00f',
                      '\uE010', '\uE011', '\uE012', '\uE013', '\uE014', '\uE015', '\uE016', '\uE017', '\uE018', '\uE019', '\uE01a', '\uE01b', '\uE01c', '\uE01d', '\uE01e', '\uE01f']
  let debounceTimeout
  const template = "<div class='form-group ci-container' style='min-height: 160px'>" +
          "<div class='form-control colored-intentions' ng-bind-html='coloredIntentions' data-test='min-height:' style='min-height: 160px'></div>" +
          // data-gramm_editor='false' is for grammarly
          "<textarea data-gramm_editor='false' spellcheck='false' class='form-control plaintext-intentions' id='box_{[{id}]}'" +
          " style='min-height: 160px; padding-bottom: 0;' rows='{[{todolistFiltered.length ? 4 : 12}]}'" +
          " focus-on='showsubmitmore'" +
          " ng-trim='false'" +
          " ng-model='localIntentions'" +
          " ng-blur='intentions = localIntentions'" +
          "></textarea>" +
          // "<pre>{[{coloredIntentions}]}</pre>" + 
        "</div>" +
        "<table ng-show='outWordsList.length' class='margin-top: 20px'><thead>"+
        "  <tr style='font-weight: bold;'>"+
        "    <td><u>outlandish word</u></td>"+
        "    <td><u>seen</u></td>"+
        "    <td><u>made</u></td>"+
        "  </tr>"+
        "</thead><tbody>"+
        "  <tr ng-repeat='item in outWordsList'>"+
        "    <td>"+
        "      <span class='invalid-anglish'>{[{item.outword}]}</span>, <em>{[{item.kind}]}</em>"+
        "      <span ng-show='item.why'><br>({[{item.why}]})</span>"+
        "    </td>"+
        "    <td>"+
        "      <ul ng-show='item.attested.length > 1'><li ng-repeat='word in item.attested'>{[{word}]}</li></ul>".trim()+
        "      <span ng-hide='item.attested.length > 1'>{[{item.attested[0]}]}</span>".trim()+
        "    </td>"+
        "    <td>"+
        "      <ul ng-show='item.unattested.length > 1'><li ng-repeat='word in item.unattested'>{[{word}]}</li></ul>".trim()+
        "      <span ng-hide='item.unattested.length > 1'>{[{item.unattested[0]}]}</span>".trim()+
        "    </td>"+
        "  </tr>"+
        "</tbody></table>"

  return {
    restrict: 'E',
    scope: {
      intentions: '=ngModel',
    },
    require: 'ngModel',
    template: template,
    controller: function($scope, $sce, $rootScope, $http) {
      var externalIntentionsChange = true
      var maybeLog = function () {}
      maybeLog = console.log
      $scope.localIntentions = $scope.intentions
      const caretHtml = '<span id="caret"></span>'
      const caretPlaceholder = '\u2038' // is a funky caret character that is unlikely to be otherwise in this box
      var caretPos = {row: Infinity, col: Infinity}
      var hasFocus = false
      $scope.$watch('localIntentions', $scope.colorizeAnglish)
      $scope.$watch('localIntentions', function (localIntentions, oldIntentions) {
        // maybeLog("%c $scope.$watch('localIntentions') externalIntentionsChange", 'color: #0aa', externalIntentionsChange)
        if (!externalIntentionsChange) {
          if ($scope.changeListener && oldIntentions !== undefined) {
            $scope.changeListener(localIntentions)
          }
          if ($scope.noDebounce) {
            $scope.intentions = $scope.localIntentions
          } else {
            if (debounceTimeout) {
              $timeout.cancel(debounceTimeout)
            }
            debounceTimeout = $timeout(function () {
              debounceTimeout = undefined
              $scope.intentions = $scope.localIntentions
              externalIntentionsChange = false
            }, 2000)
          }
        }
        // maybeLog("%c setting externalIntentionsChange from "+externalIntentionsChange+" to false", 'background-color: #0cc; color: #022')
        externalIntentionsChange = false
      })

      $scope.$watch('intentions', function (now) {
        if (now == undefined) {return}
        // maybeLog("%c $scope.$watch('intentions')", 'color: green', now)
        // maybeLog("%c setting externalIntentionsChange from "+externalIntentionsChange+" to true", 'background-color: #0cc; color: #022')
        externalIntentionsChange = true
        $scope.localIntentions = $scope.intentions
        if ($scope.intentions) {
          setTimeout($scope.updateDiv, 1)
        } else {
          $scope.updateDiv()
        }
        if (debounceTimeout) {
          $timeout.cancel(debounceTimeout)
        }
        $timeout($scope.intentionsAutoHeight)
      })
      var x = $scope.$watch('intentions', function () {
        $scope.intentionsAutoHeight()
        x() // destroy the watcher so it only runs once
      })
      $scope.safeApply = function(fn) {
        var phase = this.$root.$$phase
        if(phase == '$apply' || phase == '$digest') {
          if(fn && (typeof(fn) === 'function')) {
            fn()
          }
        } else {
          this.$apply(fn)
        }
      }
      $scope.removeCaret = function () {
        $scope.unsafeHtml = $scope.unsafeHtml.replace(caretHtml, '')
        $scope.coloredIntentions = $sce.trustAsHtml($scope.unsafeHtml)
        $scope.safeApply()
      }

      let dictList = [{
        "outword": "reason", "kind": "n/vb",
        "attested": ["grounds, wherefore, why, sakewithin reason: within groundednessvb: reckon, wit; make out, work outfaculty:  wits, wit, mind, brains, understanding"],
        "unattested": ["frum (&lt;OE fruma)", "inthing (&lt;OE intinga/inþing)", "ontimber (&lt;OE ontimber)", "orsake (calque)", "rethe (&lt;OE rǣd)", "anyet (&lt;OE andgiet)", "rake (&lt;OE racu)", "rightwiseness (&lt;OE rihtwísnes)", "shedwiseness (&lt;OE scéadwísnes)", "shed (&lt;OE gescéad)", "wit (&lt;OE gewitt)", "nift (cf. NHG Vernunft", "Dn. fornuft)"]
      }]
      let dictMap = {
        "reason": 0
      }

      $http.get('assets/eng2ang.json')
      // $http.get('/eng2ang.json')
      .then(function (response) {
        dictList = response.data
        console.log("dictList.length", dictList.length)
        console.log("random word", dictList[Math.floor(Math.random()*dictList.length)])
        dictMap = {}
        for (var i in dictList) {
          dictMap[dictList[i].outword] = parseInt(i)
        }
        console.log("dictMap", dictMap)
        // TODO = somehow get multiple parts of speech
        // eg age, n and age, vb

        // for searching etymologies, could get xml from here https://wikimedia.bringyour.com/enwiktionary/20230320/?C=S&O=D
      })

      $scope.outWordsUsed = {}
      $scope.outWordsList = []

      function colorizeWord (word) {
        const prepunct = word.match(/^(\W*)/)[1] || ''
        const postpunct = word.match(/(\W*)$/)[1] || ''
        const justword = word.replace(/^(\W*)/, '').replace(/(\W*)$/, '') || ''
        if (!justword) {return word}
        if (dictMap[justword] > -1) {
          console.log('colorizing', justword)
          $scope.outWordsUsed[justword] = dictList[dictMap[justword]]
          console.log("$scope.outWordsUsed[word]", $scope.outWordsUsed[justword])
          return `${prepunct}<span class='invalid-anglish'>${justword}</span>${postpunct}`
        }
        return word
      }

      function colorizeWords (words) {
        return words.split(/\s/).map(colorizeWord).join('\xa0')
        // return words.split(/( | \xa0)/).map(colorizeWord).join('\xa0')
      }

      // const colorsByRow = ['red', 'blue', 'green', 'orange', 'purple', 'brown', 'black', 'pink', 'yellow', 'cyan', 'magenta', 'gray', 'lime', 'maroon', 'olive', 'navy', 'teal', 'aqua', 'fuchsia', 'silver', 'gold', 'indigo', 'violet', 'coral', 'crimson', 'limegreen', 'darkgreen', 'darkblue', 'darkred', 'darkorange', 'darkgray', 'darkcyan', 'darkmagenta', 'darkviolet', 'darkolivegreen', 'darkseagreen', 'darkslategray', 'darkslateblue', 'darkturquoise', 'darkkhaki', 'darkgoldenrod']
      // wrapper[0] = `<span style='color: ${colorsByRow[rowIx % colorsByRow.length]}'>`

      $scope.colorizeAnglish = function (intentions) {
        $scope.outWordsUsed = {}
        // console.log("$scope.colorizeProse", intentions)
        let html = ''
        hasFocus = ($scope.myta === document.activeElement && document.hasFocus())
        if (!intentions) {
          if (hasFocus) {
            html = "<span class='emptyline'>" + caretPlaceholder + ' .</span>\n'
          } else {
            html = "<span class='emptyline'> .</span>\n"
          }
        } else {
          html = intentions.split('\n').map(function (text, rowIx) {
            let result = ''
            const wrapper = ['<span>','</span>']

            text = text.replace(/(^\s+)|(\s\s+)|(\s+$)/g, function (a) {return (new Array(a.length+1)).join('\xa0')})

            if (rowIx === caretPos.row && hasFocus) {
              if (text) {
                result = wrapper[0] + colorizeWords(cu.escapeHtml(text.substr(0, caretPos.col))) + caretPlaceholder +
                       colorizeWords(cu.escapeHtml(text.substr(caretPos.col))) + wrapper[1]
              } else {
                result = "<span class='emptyline'>" + caretPlaceholder + ' .' + wrapper[1]
              }
            } else {
              result = wrapper[0] + colorizeWords(cu.escapeHtml(text)) + wrapper[1]
            }
            return result
          }).join('<br>')
          if (!isFinite(caretPos.row)) {
            html += caretPlaceholder
          }
        }
        html = html.replace(new RegExp('(\\w+)'+caretPlaceholder+'(\\w+)'), `<span class='unwrap'>$1${caretHtml}$2</span>`)
        html = html.replace(caretPlaceholder, caretHtml)
        $scope.unsafeHtml = html
        $scope.coloredIntentions = $sce.trustAsHtml(html)
        $scope.outWordsList = []
        for (let word in $scope.outWordsUsed) {
          $scope.outWordsList.push(dictList[dictMap[word]])
          console.log("dictMap[word]", dictMap[word])
        }
        console.log("$scope.outWordsList", $scope.outWordsList)
        $scope.safeApply()
      }

      var lastSelectionStart = 0,
          lastSelectionEnd = 0,
          whichSelection = true
      var firstTime = true
      $scope.updateDiv = function () {
        if ($scope.myta.selectionStart != lastSelectionStart) {
          lastSelectionStart = $scope.myta.selectionStart
          whichSelection = true
        }
        if ($scope.myta.selectionEnd != lastSelectionEnd) {
          lastSelectionEnd = $scope.myta.selectionEnd
          whichSelection = false
        }

        let oldCaretPos = caretPos

        var cursorPos = whichSelection ? $scope.myta.selectionEnd : $scope.myta.selectionStart
        caretPos = {
          row: Infinity,
          col: Infinity
        }
        if ($scope.myta.value) {
          caretPos.row = $scope.myta.value.substr(0, cursorPos).split('\n').length-1
          caretPos.col = cursorPos - ($scope.myta.value.substr(0, cursorPos).lastIndexOf('\n') + 1)
        }
        $scope.colorizeAnglish($scope.localIntentions)
        firstTime = false
      }
      if ($scope.fns) {
        $scope.fns.triggerUpdate = $scope.updateDiv
        $scope.fns.bounce = function () {
          $timeout.cancel(debounceTimeout)
          $scope.intentions = $scope.localIntentions // this doesn't update literally immediately
          return $scope.intentions || '' // but this return does
        }
      }
    },
    compile: function(tElement, tAttrs) {
      let templateToUse = template
      if (tAttrs.minHeight) {
        templateToUse = template.replace(/min-height: ?160px/g, "min-height: " + tAttrs.minHeight)
      }
      tElement.html(templateToUse)
      return function($scope, $element, $attr, Emoji, ngModelCtrl) {
        $scope.container = $element[0].childNodes[0]
        $scope.mydiv = $element[0].childNodes[0].childNodes[0]
        $scope.myta = $element[0].childNodes[0].childNodes[1]
        // $scope.myta.addEventListener('input', async function handleEmoji () {
        //   $scope.myta.value = $scope.myta.value.replace(':fire:', '🔥')
        //   const textWithEmoji = $scope.myta.value // await Emoji.replaceShortcodesWithEmoji($scope.myta)
        //   ngModelCtrl.$setViewValue(textWithEmoji)
        //   ngModelCtrl.$render()
        //   // Emoji.performEmojiShortcodeSearch($input)
        // })
        $scope.myta.addEventListener('input', $scope.updateDiv)
        $scope.myta.addEventListener('focus', $scope.updateDiv)
        $scope.myta.addEventListener('focus', () => {
          setTimeout($scope.updateDiv, 1)
        })
        $scope.myta.addEventListener('mousedown', () => {
          setTimeout($scope.updateDiv, 0)
        })
        $scope.myta.addEventListener('blur', () => {
          $scope.removeCaret()
        })
        $scope.myta.addEventListener('keydown', event => {
          setTimeout($scope.updateDiv, 0)
          if ($scope.blockSearch) {
            const keysToPass = {Enter: true, ArrowUp: true, ArrowDown: true, Tab: true}
            if ($scope.fns && keysToPass[event.key]) {
              $scope.fns.onBlockSearchKeyDown(event)
              return event.preventDefault()
            }
          }
          if (event.keyCode == 33 || event.keyCode == 34) { // pgup or pgdn
            event.preventDefault() // fix disturbing page sideways glitch: https://app.intercom.com/a/apps/uie8xb07/inbox/inbox/60252/conversations/12269000002041
            // the manually make pgup & pgdn do something reasonable
            if (event.keyCode == 33) {
              $("html, body").stop().animate({scrollTop: 0}, 100, 'swing')
            } else {
              const newScroll = document.getElementById('allexceptfooter').clientHeight + 60 - window.innerHeight
              $("html, body").stop().animate({scrollTop: newScroll}, 100, 'swing')
            }
          }
        })
        $scope.myta.addEventListener('emojiupdate', $scope.updateDiv)
        $scope.myta.addEventListener('keyup', event => {
          // 2020-04-27: added this event listener to fix bug in firefox
          // where the displayed caret was lagging the real one
          // 2020-07-08: turns out issues with 33-36 too
          const arrowKeys = {
            33: 'pgup', 34: 'pgdn', 35: 'end', 36: 'home',
            37: 'L', 38: 'U', 39: 'R', 40: 'D'
          }
          if (arrowKeys[event.keyCode]) {
            $scope.updateDiv()
          }
        })
        let oldLines
        let oldHeight
        $scope.intentionsAutoHeight = function () {
          if ($scope.myta.offsetParent === null) {
            return // hidden, so autoheight won't work
          }
          var $myta = $($scope.myta)
          var newLines = $myta.val().split("\n").length
          var newHeight = $myta.height()

          // reasons for this weird logic:
            // if just the clientHeight/scrollHeight condition is used, then it resizes too early and breaks
            // if just the newLines/oldLines condition is used, then it fails to resize when lines wrap
            // ...there's probably a cleaner way but this seems to work fine 
          var shouldAutoHeight = newLines !== oldLines
          if ($scope.myta.clientHeight < $scope.myta.scrollHeight && oldHeight) {
            shouldAutoHeight = true
          }

          if (shouldAutoHeight) {
            var scrollTop = document.body.scrollTop
            var height = $myta.height()
            $myta.height( 0 )
            var scrollHeight = $scope.myta.scrollHeight
            $myta.height(height)
            $myta.animate({height: (scrollHeight + 14) + "px"}, 50)
            $($scope.mydiv).animate({height: (scrollHeight + 14) + "px"}, 50)
            $($scope.container).animate({height: (scrollHeight+14) + 'px'}, newLines > oldLines ? 1 : 50)
            document.body.scrollTop = scrollTop
            oldLines = newLines
            oldHeight = height
          }
        }
        $scope.myta.addEventListener('keyup', $scope.intentionsAutoHeight)
        $scope.myta.addEventListener('focus', $scope.intentionsAutoHeight)
        $scope.intentionsAutoHeight()
        setTimeout($scope.updateDiv, 0)

        if (typeof $attr.noDebounce === 'string') {
          $scope.noDebounce = true
        }

        $scope.$watch('focusVar', function(_focusVal) {
          $timeout(function() {
            var $myta = $($scope.myta)
            var content = $myta.val()
            // double-toggle value to put cursor at end of input
            _focusVal ? $myta.focus().val("").val(content) :
              $myta.blur()
            $scope.updateDiv()
          })
        })
      }
    }
  }
}])
