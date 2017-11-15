(function () {

   // упорядочивание по убыванию
   function compare (a, b) {
      var regExp = /\d+/g,
         _a = a.match(regExp),
         _b = b.match(regExp);
      for (var i = 0, len = Math.max(_a ? _a.length : 0, _b ? _b.length : 0); i < len; i++) {
         var aCur = _a && parseInt(_a[i] || '0', 10),
            bCur = _b && parseInt(_b[i] || '0', 10);
         if (aCur !== bCur) {
            return aCur > bCur ? -1 : aCur < bCur && 1;
         }
      }
      return 0;
   };

   // получение id пользователя
   function getUserId () {
      var scripts = document.scripts,
         userId;
      for (var i = 0; i < scripts.length; i++) {
         var innerHtml = scripts[i].innerHTML,
            tmpUserId = innerHtml && innerHtml.match(/current_user_id\=[\d]+\;/);
         if (tmpUserId) {
            userId = +('' + tmpUserId).match(/[\d]+/g);
            break;
         }
      }
      return userId;
   }

   var url = document.URL,
      pageTitle = document.getElementsByClassName('page-title'),
      labelBranch = document.querySelectorAll('p.slead .label-branch'),
      title = document.querySelectorAll('h1.title'),
      notes = document.querySelectorAll('ul.notes'),
      blueButton = document.querySelectorAll('.btn.btn-info[title="New Merge Request"]'),
      buttonsStr = '',
      mrRegExp = /merge_requests\/[\d]+/g,
      mrIdMatch = url.match(mrRegExp),
      i,
      len;

   if ((url.match(/new\?/) || []).length) {
      var xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function () {
         if (this.readyState == 4 && this.status == 200) {
            var versions = this.responseText.match(/>\n(rc-[\d\.]*|development)\n</g).sort(compare),
               uniqueVersions = [],
               verName,
               formGroup = document.querySelectorAll('.form-group'),
               isCurrent = false;
            labelBranch = labelBranch && labelBranch.length && labelBranch[labelBranch.length-1];
            for (i = 0, len = versions.length; i < len; i++) {
               verName = versions[i].match(/rc-[\d\.]*|development/) + [];
               if (uniqueVersions.indexOf(verName) < 0) {
                  uniqueVersions.splice(verName === 'development' ? 0 : uniqueVersions.length, 0, verName);
               }
            }
            for (i = Math.min(5, uniqueVersions.length) - 1; i >= 0; i--) {
               verName = uniqueVersions[i];
               isCurrent = labelBranch.textContent === verName;
               buttonsStr += '<a class="branch' +
                     (isCurrent ? ' current-branch' : '') + '"' +
                     (!isCurrent ? ' href="' +
                        url.replace(/target_branch%5D=[\w\.\-\%]*/, 'target_branch%5D=' + verName) + '"' +
                        ' target="_blank"' : '' ) +
                     '>' +
                     verName +
                  '</a>';
            }
            pageTitle && pageTitle.length && (pageTitle[0].innerHTML += buttonsStr);
            if (formGroup && formGroup.length) {
               for (i = 0, len = formGroup.length; i < len; i++) {
                  formGroup[i].className += ' ws-hidden';
               }
            }
         }
      }.bind(xhttp);
      xhttp.open('GET', url.split('?')[0], true);
      xhttp.send();
   }
   else if ((url.match(/new$|new#/) || []).length) {
      var sourceBranches = document.querySelectorAll('.dropdown-source-branch .dropdown-content a'),
         targetBranches = document.querySelectorAll('.dropdown-target-branch .dropdown-content a');

      for(var i = 0, len = sourceBranches.length; i < len; i++){
         sourceBranches[i].onclick = function (e) {
            var targetBrVer = 'rc-' + e.target.innerText.split('\/')[0],
               targetBr = document.querySelectorAll('.dropdown-target-branch [data-id="' + targetBrVer + '"]');
            targetBr && targetBr.length && targetBr[0].click();
         }
      }
   }
   else if (mrIdMatch && mrIdMatch.length) {
      var curId = parseInt(mrIdMatch[0].match(/\d+/)),
         sideLen = 3,
         viewLinkText = function (num) {
            var res = num % 100;
            return res < 10 ? '0' + res : res + '';
         };
      for (i = -sideLen; i <= sideLen; i++) {
         if (i !== 0) {
            var nextId = curId + i;
            buttonsStr += '<a /' +
            'class="' + (i < 0 ? 'prev' : 'next') + '" targetMR="' + nextId + '" title="' + nextId + '">' + viewLinkText(nextId) + '</a>';
         }
         else {
            buttonsStr += '<span class="curr" title="' + curId + '">' + viewLinkText(curId) + '</span>';
         }
      }

      if (title && title.length && (title = title[0])) {
         var userId = getUserId(),
            mrsUrlParams = typeof userId === 'number' ? '?scope=all&state=opened&utf8=✓&author_id=' + userId : '',
            mrsUrl = url.replace(/merge_requests\/.*/, 'merge_requests/');
         title.innerHTML += ' / <a href="' + mrsUrl + '">merge_requests</a>:<span class="mr-buttons">' + buttonsStr + '</span> / <a href="' + mrsUrl + mrsUrlParams + '">my</a>';
         var mrLinks = title.querySelectorAll('a[targetMR]');
         for (i = 0, len = mrLinks.length; i < len; i++) {
            mrLinks[i].onclick = function (e) {
               document.location.href = url.replace(mrRegExp, 'merge_requests/' + e.target.getAttribute('targetMR'));
            };
         }
      }
   }

   if (blueButton && blueButton.length && (blueButton = blueButton[0])) {
      var blueButtonHref = blueButton.href;
         sourceBrVer = (blueButtonHref.match(/source_branch%5D=[\d\.]+/) + []).match(/[\d\.]{2,}/);
      blueButton.href = blueButtonHref.replace(/target_branch%5D=rc-[\d\.]+/, 'target_branch%5D=rc-' + sourceBrVer);
   }

   var targetLinks = document.querySelectorAll(
         '.btn.btn-info[title="New Merge Request"], ' +  // синяя кнопка создания MR из последней запушенной ветки
         '.btn.btn-new[title="New Merge Request"], ' +   // зелёная кнопка создания MR
         'a.row_title, ' +                               // ссылки MergeRequest'ов
         '.title a, ' +                                  // ссылки в title страницы
         'ul.nav.nav-sidebar a[href]'                    // ссылки в правом меню
   );
   for (i = 0, len = targetLinks.length; i < len; i++) {
      targetLinks[i].setAttribute('target', '_top');
   }
})();