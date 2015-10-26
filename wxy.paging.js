(function($) {
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
			showSum : true,
			showNoMore : true,
			autoLoad : false,
			triggerByScroll : false,// 是否滑动加载
			isScrollByBottom : true,// 是否滑动到底部加载
			disToTrigger : 30,// 滑动模式下，当距离底部或者顶部多少像素时触发加载
			scrollHolder : ""
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
					console
							.log(json, ' has no child obj named ',
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
				if ($tmpl.render) {
					return $tmpl.render(item);
				} else {
					console.error("there is no render plugin!");
				}
				return "";
			}
		},
		msgs : {
			error : "加载出错",
			loading : "正在加载",
			allLoaded : "没有更多了！",
			sum : "共%s条",
			noContent : "暂无记录",
			unknown : "未知",
			ajaxError : "网络异常",
			dataError : "数据格式出错",
			renderError : "数据解析失败"
		},
		pageLoadBefore : function(dataArray, page, total) {// this $pageHodler
		},
		pageLoaded : function(dataArray, page, total) {// this $pageHodler
		},
		itemLoaded : function(item, count, total) {// this $itemHodler
		},
		statusChanged : function(statusTo, statusFrom, msg) {// this $el
		},
		showWarn : function(msg) {
		}
	};

	// 0可以加载更多，-1加载出错，1加载完了，2正在加载,3暂无内容
	var STATUS = {
		loading : "loading",
		error : "error",
		allLoaded : "allLoaded",
		noContent : "noContent",
		normal : "normal"
	};

	var Paging = function($el, options) {
		this._$el = $el;
		options = $.extend(true, {}, DEFAULTS, options || {});
		this._options = options;
		this._page = options.ajax.data.page || 1;
		this._pageCount = 0;
		this._startPage = options.ajax.data.page;
		this._status = STATUS.normal;
		this._itemCount = 0;

		this._$nextPage = find$fromRootOrDoc($el, options.handler.nextPage);
		this._$status = find$fromRootOrDoc($el, options.handler.status);

		this._$holder = get$fromRootOrRoot($el, options.handler.holder);
		this._$scrollHolder = get$fromRootOrRoot($el,
				options.handler.scrollHolder);

		this.init();
	};

	var find$fromRootOrDoc = function($root, selector) {
		var $el = $root.find(selector);
		if ($el.length == 0) {
			$el = $(selector);
		}
		return $el;
	};

	var get$fromRootOrRoot = function($root, selector) {
		if (selector) {
			var $el = $root.find(selector);
			if ($el.length) {
				return $el;
			}
		}
		return $root;
	}

	var ptype = Paging.prototype;

	ptype.ajaxPage = function(page) {
		this._page = page;
		this._loaded = true;
		var self = this;
		self.changeStatus(STATUS.loading);

		var ajax = self._options.ajax;
		ajax.data.page = page;
		ajax.success = function(json, status) {
			if (typeof json == "string") {
				json = $.parseJSON(json);
			}
			self.ajaxSuccess(page, json, status);
		};
		ajax.error = function(xrh, ts, et) {
			self.ajaxError(page, xrh, ts, et);
		};
		$.ajax(ajax);
		console.log("load page:", page);
	};

	ptype.nextPage = function() {
		var self = this;
		switch (self._status) {
			case STATUS.loading :
				console.log("page has been loading");
				return;
			case STATUS.allLoaded :
				console.log("all have been Loaded");
				return;
			case STATUS.noContent :
				console.log("no content");
				return;
			case STATUS.normal :

		}
		var page = this._page;
		if (this._loaded) {
			page++;
		}
		self.ajaxPage(page);
	};

	// 检验是否scoll dom 到了底部 $scrollHolder
	ptype.isInBottomArea = function(dis) {
		var scrollTop = this._scrollHolder.scrollTop;
		var innerHeight = this._$scrollHolder.innerHeight();
		var scrollHeight = this._scrollHolder.scrollHeight + 17;
		// console.log("(scrollTop + innerHeight) , (scrollHeight - dis)",
		// (scrollTop + innerHeight), (scrollHeight - dis));
		return (scrollTop + innerHeight) >= (scrollHeight - dis);
	}

	// 检验是否scoll dom 到了顶部 this=dom contentHolder
	ptype.isInTopArea = function(dis) {
		// console.log("this._$scrollHolder[0].scrollTop,dis",
		// this._$scrollHolder[0].scrollTop, dis);
		return this._$scrollHolder[0].scrollTop <= dis;
	}

	var evScroll = "scroll.paging", evClick = "click.paging";

	ptype.init = function() {
		var self = this;
		var options = this._options;

		// 滑动加载
		if (options.handler.triggerByScroll) {
			var disToTrigger = options.handler.disToTrigger || 30;
			var isByBt = options.handler.isScrollByBottom;
			var $scrollHoder = this._$scrollHolder;
			this._scrollHolder = $scrollHoder[0];
			self._notArr = true;
			// console.log($scrollHoder);
			// $scrollHoder.css("overflow","scroll");
			// $scrollHoder = $(window);
			$scrollHoder.off(evScroll).on(evScroll, function() {
				// console.log("scroll.paging");
				var inTriggerArea = self[isByBt
						? "isInBottomArea"
						: "isInTopArea"](disToTrigger);
				if (self._notArr && inTriggerArea) {
					console.log("scroll trigger page load!");
					self.nextPage();
					self._notArr = false;
				} else if (!inTriggerArea) {
					self._notArr = true;
				}
			});
		} else {
			self._$nextPage.off(evClick).on(evClick, function() {
						self.nextPage();
					});
		}

		if (options.handler.autoLoad) {
			this.load();
		}
	}

	ptype.load = function() {
		this.ajaxPage(this._startPage);
	}

	ptype.reload = function() {
		this.load();
	}

	ptype.ajaxError = function(page, xrh, ts, et) {
		console.error("load page:", page, " error!", ts, xrh.responseText);
		this.changeStatus(STATUS.error, this._options.msgs.ajaxError);
	};

	ptype.renderPage = function(dataArray, page, pageTotal, itemTotal) {
		var self = this;
		var options = this._options;
		try {
			var dr = options.dataRender;
			var $ph = dr.createPageHolder().attr("data-page", page);
			//
			dataArray.forEach(function(item, idx) {
						$ph[self.isAppend() ? "append" : "prepend"](self
								.renderItem(item, idx, itemTotal));
					});
			self.changeStatus(dataArray.length < options.dataParser.pageSize
					? STATUS.allLoaded
					: STATUS.normal);
			this._pageCount++;
			return $ph;
		} catch (e) {
			console.log(e);
			self.changeStatus(STATUS.error, options.msgs.renderError);
		}
		return "";
	};

	ptype.renderItem = function(item, idx, total) {
		var self = this;
		var options = this._options;
		var dr = options.dataRender;
		var $item = dr.createItemHolder().attr("data-item", idx);
		$item.append(dr.renderItem(item));
		self._itemCount++;
		options.itemLoaded.call($item, item, self._itemCount, total);
		return $item;
	};

	ptype.ajaxSuccess = function(page, json, status) {
		var options = this._options;
		var dp = options.dataParser;
		if (dp.isSuccess(json)) {
			var darray = dp.getDataArray(json);
			var pageTotal = dp.getPageTotal(json);
			var itemTotal = dp.getItemTotal(json);
			if (darray == null) {
				this.changeStatus(STATUS.error, options.msgs.dataError);
			} else if (darray.length < 1) {
				if (this._page == this._startPage) {
					this.changeStatus(STATUS.noContent);
				} else {
					this.changeStatus(STATUS.allLoaded);
				}
			} else {
				if (options.dataParser.reverse) {
					darray.reverse();
				}
				var $page = this.renderPage(darray, page, pageTotal, itemTotal);
				if ($page) {
					options.pageLoadBefore.call($page, darray, page, pageTotal);
					this._$holder[this.isAppend() ? "append" : "prepend"]($page);
					this.fixScrollByTop();
					this.fixScrollPause();
					options.pageLoaded.call($page, darray, page, pageTotal);
				}
			}
		} else {
			var msg = dp.getMessage(json);
			console.log("load failed page:", page, " msg:", msg);
			this.changeStatus(STATUS.error, msg);
		}
	};

	// 解决滑动加载模式下，滑动到顶部触发加载时，滑动条位置不变化的问题
	ptype.fixScrollByTop = function() {
	}

	// 触发滚动，防止第一页内容高度不够，没能autoScroll
	ptype.fixScrollPause = function() {
		if (this._options.handler.triggerByScroll) {
			this._$scrollHolder.trigger(evScroll);
		}
	}

	ptype.isAppend = function() {
		return this._options.dataParser.isAppend;
	}

	ptype.changeStatus = function(status, msg) {
		var self = this;
		var options = self._options;
		var msgs = options.msgs;
		var $status = self._$status;
		var $nextPage = self._$nextPage;
		switch (status) {
			case STATUS.loading :
				$status.show().text(msgs.loading);
				$nextPage.hide();
				break;
			case STATUS.allLoaded :
				var smsg = options.handler.showSum ? options.msgs.sum.replace(
						"%s", this._itemCount) : msgs.allLoaded;
				$status.show().text(smsg);
				$nextPage.hide();
				break;
			case STATUS.noContent :
				$status.show().text(msgs.noContent);
				$nextPage.hide();
				break;
			case STATUS.error :
				msg = msg || msgs.unknown;
				$status.show().text(msg);
				options.showWarn(msg);
				break;
			case STATUS.normal :
				$nextPage.show();
				$status.hide();
				break;
		}
		var statusFrom = self._status;
		self._status = status;
		console.log("changeStatus: from ", statusFrom, " to ", status);
		options.statusChanged.call(this._$el, status, statusFrom, msg);
	}

	var old = $.fn.paging;

	$.fn.paging = function(options) {
		var args = Array.prototype.slice.call(arguments, 1);
		var returnValFlag = false, returnVal;
		var handler = function() {
			var $this = $(this);
			var paging = $this.data("wxy.paging");
			if (!paging) {
				paging = new Paging($this, options);
				$this.data("wxy.paging", paging);
			}
			if (typeof options == "string") {
				console.log("call method:" + options);
				if (["load", "reload"].indexOf(options) != -1) {
					paging[options].apply(paging, args);
				} else if ([].indexOf(options) != -1) {
					returnValFlag = true;
					returnVal = paging[options].apply(paging, args);
					return false;
				}
			}
		};
		this.each(handler);
		if (returnValFlag) {
			return returnVal;
		} else {
			return this;
		}
	};
	$.fn.paging.noConflict = function() {
		$.fn.paging = old;
		return this;
	};
	$.fn.paging.DEFAULTS = DEFAULTS;
}(window.Zepto || window.jQuery))