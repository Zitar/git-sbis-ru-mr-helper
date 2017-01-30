(function () {
   var
         url = document.URL,
         pageTitle = document.getElementsByClassName('page-title'),
         title = document.querySelectorAll('h1.title'),
         notes = document.querySelectorAll('ul.notes'),
         buttonsStr = '',
         mrRegExp = /merge_requests\/[\d]+/g,
         mrIdMatch = url.match(mrRegExp),
         i,
         len,
   // упорядочивание по убыванию
         compare = function (a, b) {
            return a > b ? -1 : a < b ? 1 : 0;
         };

   if ((url.match(/new\?/) || []).length) {
      var xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function () {
         if (this.readyState == 4 && this.status == 200) {
            var versions = this.responseText.match(/>\n(rc-[\d\.]*|development)\n</g).sort(compare),
                  uniqueVersions = [],
                  verName,
                  formGroup = document.querySelectorAll('.form-group');
            for (i = 0, len = versions.length; i < len; i++) {
               verName = versions[i].match(/rc-[\d\.]*|development/) + [];
               if (uniqueVersions.indexOf(verName) < 0) {
                  uniqueVersions.splice(verName === 'development' ? 0 : uniqueVersions.length, 0, verName);
               }
            }
            for (i = Math.min(5, uniqueVersions.length) - 1; i >= 0; i--) {
               verName = uniqueVersions[i];
               buttonsStr += '<a class="branch" href="' + url.replace(/target_branch%5D=[\w\.\-\%]*/, 'target_branch%5D=' + verName) + '" target="_blank">' + verName + '</a>';
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
   else {
      if (mrIdMatch && mrIdMatch.length) {
         var curId = parseInt(mrIdMatch[0].match(/\d+/)),
               sideLen = 5,
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
            title.innerHTML += '&nbspmerge requests:<span class="mr-buttons">' + buttonsStr + '</span>';
            var mrLinks = title.querySelectorAll('a[targetMR]');
            for (i = 0, len = mrLinks.length; i < len; i++) {
               mrLinks[i].onclick = function (e) {
                  document.location.href = url.replace(mrRegExp, 'merge_requests/' + e.target.getAttribute('targetMR'));
               };
            }
         }
      }
   }
   var targetLinks = document.querySelectorAll(
         '.btn.btn-info[title="New Merge Request"], ' +  // синяя кнопка создания MR из последней запушенной ветки
         'a.row_title, ' +                               // ссылки MergeRequest'ов
         '.title a, ' +                                  // ссылки в title страницы
         'ul.nav.nav-sidebar a[href]'                    // ссылки в правом меню
   );
   for (i = 0, len = targetLinks.length; i < len; i++) {
      targetLinks[i].setAttribute('target', '_top');
   }
})();