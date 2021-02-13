"use strict";

function WebRequestCSP(marker) {
  return Object.assign(
    new CapsCSP(new NetCSP(marker)),
    {
      patchHeaders(responseHeaders, capabilities) {
        let header = null;
        let blocker;
        if (capabilities) {
          let contentType = responseHeaders.filter(h => h.name.toLowerCase() === "content-type");
          let blockHTTP = contentType.length === 0 || contentType.some(h => !/^(?:text|application)\/\S*\b(?:x?ht|x)ml\b/i.test(h.value));
          blocker = this.buildFromCapabilities(capabilities, blockHTTP);
        }
        let extras = [];
        responseHeaders.forEach((h, index) => {
          if (this.isMine(h)) {
            header = h;
            if (h.value === blocker) {
              // make this equivalent but different than the original, otherwise
              // it won't be (re)set when deleted, see
              // https://dxr.mozilla.org/mozilla-central/rev/882de07e4cbe31a0617d1ae350236123dfdbe17f/toolkit/components/extensions/webrequest/WebRequest.jsm#138
              blocker += " ";
            } else {
              extras.push(...this.unmergeExtras(h));
            }
            responseHeaders.splice(index, 1);
          } else if (blocker && /^(Location|Refresh)$/i.test(h.name)) {
            // neutralize any HTTP redirection to data: URLs, like Chromium
            let  url = /^R/i.test(h.name)
              ? h.value.replace(/^[^,;]*[,;](?:\W*url[^=]*=)?[^!#$%&()*+,/:;=?@[\]\w.,~-]*/i, "") : h.value;
            if (/^data:/i.test(url)) {
              h.value = h.value.slice(0, -url.length) + "data:";
            }
          }
        });

        if (blocker) {
          header = this.asHeader(blocker);
          responseHeaders.push(header);
        }

        if (extras.length) {
          responseHeaders.push(...extras);
        }

        return header;
      }
    }
  );
}
