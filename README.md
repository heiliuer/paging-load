# paging-load
`jquery paging load plugin`
`滑动，分页加载jquery（Zepto）插件`

##DEMO
[demo](index.html)

## 示例

###json数据
[点击查看](http://heiliuer.github.io/paging-load/)

###css
    html{
        height: 100%;
    }
    body{
        height: 100%;
    }
###html

    <div id="content-notice">
        <div class="main"></div>
        <div class="footer">
            <!-- <p id="nextPage" class="center">加载更多</p> -->
            <p id="status" style="text-align: center"></p>
        </div>
    </div>
    
    <script id="tmpl-msg" type="wxy/template">
        <div style="border-bottom: 1px solid #ccc">
            {{for message}}
            <b>{{>title}}</b>
            <p>{{>content}}</p>
            {{/for}}
        </div>
    </script>

###js
    <script src="js/jquery.js"></script>
    <script src="js/jsrender.min.js"></script>
    <script src="js/wxy.paging.js"></script>
    <script>
        var config = {
            ajax: {
                url: "data/page.json",
                data: {}
            },
            handler: {
                autoLoad: true,
                triggerByScroll: true,
                holder: ".main",
                scrollHolder: "body"
            },
            dataParser: {
                pageSize: 10,
                reverse: false,
                isAppend: true,
                nameArray: "messages"
            },
            dataRender: {
                tmplSelector: "#tmpl-msg"
            },
            msgs: {
                allLoaded: "已加载所有通知（共%s条）",
                noContent: "暂无内容"
            },
            pageLoaded: function (dataArray, page, total) {// this
                // $pageHodler
                this.find("[data-init]").trigger("init");
            },
            itemLoaded: function (item, count, total) {// this
                // $itemHodler
            },
            statusChanged: function (statusTo, statusFrom, msg) {// this
                // $el
            },
            showWarn: function (msg) {
            }
        }
    
        $("#content-notice").paging(config);
    </script>


### 模板引擎推荐使用通jsrender
[点击下载](/js/jsrender.min.js)
可以自行选择其他插件，要求提供$.fn.render(data)接口
# 配置说明
    // 插件默认配置
    var DEFAULTS = {
        ajax : {
            url : "",
            dataType : "JSON",
            cache : false,
            data : {
                page : 1
            },
            type : "get"
        },
        handler : {
            nextPage : "#nextPage",
            status : "#status",
            holder : "",
            showNoContent : true,
            showAllLoaded : true,
            autoLoad : false,
            triggerByScroll : false,// 是否滑动加载
            isScrollByBottom : true,// 是否滑动到底部加载
            disToTrigger : 30,// 滑动模式下，当距离底部或者顶部多少像素时触发加载
            scroller : window,// 监听滑动事件的dom
            scrollHolder : "body"// 滑动模式下
            // 可以计算滑动距离的滑动内容（this.scrollTop，$this.innerHeight,最好是body，为空的时候为当前插件$root）的dom
        },
        dataParser : {
            pageSize : 10,
            reverse : false,
            isAppend : true,
            nameData : "data",
            nameArray : "items",
            isSuccess : function(json) {
                return json.status == 0;
            },
            getMessage : function(json) {
                return json.message;
            },
            getPageTotal : function(json) {
                return json.pageTotal;
            },
            getItemTotal : function(json) {
                return json.itemTotal;
            },
            getDataArray : function(json) {
                var data = json[this.nameData];
                if (data) {
                    var array = data[this.nameArray];
                    if ($.isArray(array)) {
                        return array;
                    }
                    console.log(data, ' has no child array named ',
                            this.nameArray);
                } else {
                    console.log(json, ' has no child obj named ',
                            this.nameData);
                }
                return null;
            }
        },
        dataRender : {
            tmplSelector : "#template",
            createPageHolder : function() {
                return $("<div>");
            },
            createItemHolder : function() {
                return $("<div>");
            },
            renderItem : function(item) {
                var $tmpl = $(this.tmplSelector);
                // debuglog("$tmpl:", $tmpl, item);
                if ($tmpl.render) {
                    return $tmpl.render(item);
                } else {
                    console.error("there is no render plugin!");
                }
                return "";
            },
            animation : "show"
        },
        msgs : {
            scrollLoad : "上拉加载更多",
            error : "加载出错",
            loading : "正在加载",
            allLoaded : "已加载所有内容,共%s条",
            noContent : "暂无内容",
            unknown : "未知",
            ajaxError : "网络异常",
            dataError : "数据格式出错",
            renderError : "数据解析失败"
        },
        pageLoadBefore : function(dataArray, page, total) {// this
            // $pageHodler
        },
        pageLoaded : function(dataArray, page, total) {// this
            // $pageHodler
        },
        itemLoaded : function(item, count, total) {// this $itemHodler
        },
        statusChanged : function(statusTo, statusFrom, msg) {// this
            // $el
        },
        showWarn : function(msg) {
        }
    };

