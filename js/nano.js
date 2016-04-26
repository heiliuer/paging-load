/**
 * ! Created by Heiliuer on 2016/4/11.
 * 轻量级模板引擎 hao.wang  {{}}
 */
String.prototype.escapeHTML = function () {
    return this.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g,
        '&lt;').replace(/"/g, '&quot;');
};
window.nano = function () {
    var parseEval = function (evalStr, escapeHTML) {
        try {
            var result = eval(evalStr);
            if (typeof result == "number") {
                return result;
            }
            if (typeof result != "undefined") {
                return (escapeHTML ? ("" + result).escapeHTML() : ("" + result))
                    || "";
            }
        } catch (e) {
            console.log(e);
        }
        return "";
    }
    return function (template, data, dataName) {
        var templateHtml = template.replace(/\{{(.*?)\}}/g, function (str,
                                                                      evalStr) {
            this[dataName] = data;
            return parseEval.call(this, evalStr, true);
        });
        templateHtml = templateHtml.replace(/\[\[(.*?)\]\]/g, function (str,
                                                                        evalStr) {
            this[dataName] = data;
            return parseEval.call(this, evalStr, false);
        });
        return templateHtml;
    }
}();