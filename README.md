# paging-load
`jquery paging load plugin`
`滑动，分页加载jquery（Zepto）插件`

##DEMO
[demo](index.html)

## 示例

###json数据
[点击查看](/data/page.json)
###html
	<div class="wrap">
		<div id="content-notice">
			<div class="main"></div>
			<div class="footer">
				<!-- <p id="nextPage" class="center">加载更多</p> -->
				<p id="status" class="center"></p>
			</div>
		</div>
	</div>
	<script id="tmpl-msg" type="wxy/template">
		<div class="news-item {{:readed?'readed':''}}">
			{{for message}}
			<div class="news-title"><h2>{{>title}}</h2></div>
			<div class="news-infor">
				<p>
					<span class="author" data-view-person='{"data":{"teacherId":"{{>senderId}}"}}'>{{>senderName}}老师</span>
					<span class="time">{{:~formateDate(createTime)}}</span>
				</p>
			</div>
			<div class="news-content">
				{{if images}}
				<div class="news-gallery" data-preview-index="0" data-previews='{{:~toJson(images)}}' data-init="lazy">						
					<p><img data-original="{{:images[0]}}" src="" alt=""></p>
					<span><i class="fa fa-image"></i>{{:images.length}}</span>
				</div>
				{{/if}}

				<p>{{:~handleContent(content)}}</p>

				{{if voices}}
					<div class="news-voice" data-init="voice">
						{{for voices}}
							<div class="voice-box" data-voice-src="{{:url}}" data-duration="{{:duration?duration:0}}">
								<input readonly data-linecap=round class="knob" data-min="0" data-max="60" data-width="70" data-height="70" data-angleOffset="0" data-fgColor="#16BE45" data-bgColor="#E5E5E5" data-skin="tron" data-thickness=".05" value="{{:duration?duration:0}}">
								<i class="fa fa-play"></i>
							</div>
						{{/for}}
					</div>
				{{/if}}
				
				<p class="more"><a href="/${schoolId}/page/notice/{{:id}}">查看全部</a></p>
			</div>
			<div class="news-footer news-check">
				<span class="readonly"><a href="javascript:"><i class="fa fa-file-text-o"></i>{{:readCount}}</a></span>
				<span><a href="/${schoolId}/page/notice/{{:id}}"><i class="fa fa-commenting-o"></i>{{:replyShowCount}}</a></span>
				{{/for}}
				<span data-type="message" data-praise-for="{{:message.id}}" data-praised="{{:isPraised}}" class="{{:isPraised?'active':''}}"><a href="javascript:" data-count><i class="fa fa-thumbs-o-up"></i>{{:message.praiseCount}}</a></span>
			</div>
		</div>
	</script>

###js
    var config = {
        ajax : {
            url : '/' + PAGE.schoolId + '/page/notice/history/json',
            url2 : "/static/mask/jz/notice/history.json",
            data : {
                studentId : PAGE.studentId
            }
        },    
        handler : {
            autoLoad : true,
            triggerByScroll : true,
            holder : ".main",
            scrollHolder : "body"
        },
        dataParser : {
            pageSize : 10,
            reverse : false,
            isAppend : true,
            nameArray : "messages"
        },
        dataRender : {
            tmplSelector : "#tmpl-msg"
        },        
        msgs : {
            allLoaded : "已加载所有通知（共%s条）",
            noContent : "暂无内容"
        },
        pageLoaded : function(dataArray, page, total) {// this
            // $pageHodler
            this.find("[data-init]").trigger("init");
        },
        itemLoaded : function(item, count, total) {// this
            // $itemHodler
        },
        statusChanged : function(statusTo, statusFrom, msg) {// this
            // $el
        },
        showWarn : function(msg) {
        }
    }
    
    $("#content-notice").paging(config);

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

