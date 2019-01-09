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

   function getUrlToSearchBranch (searchStr) {
      return url.replace(/\/merge_requests.*/, '/refs?search=' + searchStr + '&find=branches');
   }

   var url = document.URL,
      pageTitle = document.getElementsByClassName('page-title'),
      labelBranch = document.querySelectorAll('p.slead .ref-name'),
      breadCrumbs = document.querySelectorAll('.breadcrumbs .breadcrumbs-list'),
      notes = document.querySelectorAll('ul.notes'),
      navLink = document.querySelectorAll('.nav-sidebar .sidebar-top-level-items a[href*="merge_requests"]'),
      blueButton = document.querySelectorAll('.event-last-push .btn.btn-info'),
      buttonsStr = '',
      mrRegExp = /merge_requests\/[\d]+/g,
      mrIdMatch = url.match(mrRegExp),
      i,
      len;

   // создание нового Merge Request'а
   if ((url.match(/new\?/) || []).length) {
      var xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function () {
         if (this.readyState == 4 && this.status == 200) {
            var xhttpForDev = new XMLHttpRequest(),
               versions = (JSON.parse(this.response).Branches || []).sort(compare),
               uniqueVersions = [],
               verName,
               formGroup = document.querySelectorAll('.form-group'),
               isCurrent = false;
            labelBranch = labelBranch && labelBranch.length && labelBranch[labelBranch.length-1];
            for (i = 0, len = versions.length; i < len; i++) {
               verName = versions[i].match(/^rc-[\d\.]*|^development/);
               if (verName && verName.length) {
                  verName += [];
                  if (uniqueVersions.indexOf(verName) < 0) {
                     uniqueVersions.splice(verName === 'development' ? 0 : uniqueVersions.length, 0, verName);
                  }
               }
            }
            for (i = Math.min(5, uniqueVersions.length) - 1; i >= 0; i--) {
               verName = uniqueVersions[i];
               isCurrent = labelBranch.textContent === verName;
               buttonsStr += '<a class="branch' +
                  (isCurrent ? ' current-branch' : '') + '"' +
                  (!isCurrent ? ' href="' +
                     url.replace(/target_branch%5D=[\w\.\-\%]*/, 'target_branch%5D=' + verName) + '"' +
                     ' target="_blank"' : '') +
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
      xhttp.open('GET', getUrlToSearchBranch('rc-'), true);
      xhttp.send();
   }

   // просмотрт созданного Merge Request'а
   else if (mrIdMatch && mrIdMatch.length) {
      var curId = parseInt(mrIdMatch[0].match(/\d+/)),
         sideLen = 3,
         viewLinkText = function (id) {
            var res = id % 100;
            return res < 10 ? '0' + res : res + '';
         },
         linkHref = function (id) {
            return (mrUrlPrefix || '') + id;
         },
         lastLi,
         lastLiLink,
         mrUrlPrefix;
      if (breadCrumbs && breadCrumbs.length && (breadCrumbs = breadCrumbs[0])) {
         lastLiLink = breadCrumbs.querySelectorAll('a[href*="merge_requests/' + curId + '"]');
         lastLi = lastLiLink && lastLiLink.length && lastLiLink[0].parentElement;
         mrUrlPrefix = lastLiLink.length && lastLiLink[0].href.replace(/merge_requests\/.*/, 'merge_requests/');

         for (i = -sideLen; i <= sideLen; i++) {
            var nextId = curId + i;
            buttonsStr += '<a ' +
               'class="merge-requests-link ' + (i < 0 ? 'prev' : i === 0 ? 'curr' : 'next') +
               (i !== 0 ? '" href="' + linkHref(nextId) +
                  '" targetMR="' + nextId + '" title="' + nextId : '') +
               '">' + viewLinkText(nextId) + '</a>';
         }

         lastLi.innerHTML = buttonsStr;
      }
   }

   // добавление ссылки "My MRs"
   if (navLink && navLink.length) {
      var mrLink = navLink[0],
         mrLinkParent = mrLink.parentElement,
         userId = getUserId(),
         mrsUrlParams = typeof userId === 'number' ? '?scope=all&state=opened&utf8=✓&author_id=' + userId : '',
         myMrLink = mrLinkParent.cloneNode(true);
         myMrLinkClass = '';
      if(~location.search.indexOf('author_')){
         myMrLink.className = 'active';
         mrLinkParent.className = mrLinkParent.className.replace('active', '');
      }
      else {
         myMrLink.className = '';
      }
      myMrLink.innerHTML = '<a class="' + mrLink.className + '" href="' + mrLink.href + mrsUrlParams + '">My MRs</a>';
      mrLinkParent.parentElement.insertBefore(myMrLink, mrLinkParent.nextSibling);
   }

   // обработчик на виней кнопке создания Merge Request'а из последней запушенной ветки
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