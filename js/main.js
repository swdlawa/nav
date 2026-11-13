/* ==========================================================================
   拾页导航 — 交互脚本
   原生 JS，无依赖。所有功能都是渐进增强：关掉 JS 页面仍可浏览。
   ========================================================================== */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;

  /* --- 主题 ------------------------------------------------------------- */
  var themeToggle = doc.querySelector("[data-theme-toggle]");
  var themeMeta = doc.querySelector('meta[name="theme-color"]');

  /* 应用主题：改 <html data-theme>、更新按钮状态、同步浏览器地址栏颜色。
     persist=true 时写入 localStorage，下次打开还记得。 */
  function applyTheme(theme, persist) {
    root.setAttribute("data-theme", theme);
    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
      themeToggle.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
      );
    }
    if (themeMeta) {
      themeMeta.setAttribute("content", theme === "dark" ? "#0f1612" : "#f2f5ef");
    }
    if (persist) {
      try {
        localStorage.setItem("theme", theme);
      } catch (err) {
        /* 隐私模式忽略 */
      }
    }
  }

  applyTheme(root.getAttribute("data-theme") === "dark" ? "dark" : "light", false);

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark", true);
    });
  }

  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  if (mq.addEventListener) {
    mq.addEventListener("change", function (event) {
      var saved = null;
      try {
        saved = localStorage.getItem("theme");
      } catch (err) {
        /* 忽略 */
      }
      if (!saved) applyTheme(event.matches ? "dark" : "light", false);
    });
  }

  /* --- 移动端菜单 -------------------------------------------------------- */
  var navToggle = doc.querySelector("[data-nav-toggle]");
  var siteNav = doc.getElementById("site-nav");

  function closeNav() {
    if (!siteNav || !navToggle) return;
    siteNav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
  }

  if (navToggle && siteNav) {
    navToggle.addEventListener("click", function () {
      var open = siteNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });

    siteNav.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeNav();
    });

    doc.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      if (!siteNav.classList.contains("is-open")) return;
      closeNav();
      navToggle.focus();
    });

    doc.addEventListener("click", function (event) {
      if (!siteNav.classList.contains("is-open")) return;
      if (siteNav.contains(event.target) || navToggle.contains(event.target)) return;
      closeNav();
    });
  }

  /* --- 滚动状态与回到顶部 ------------------------------------------------ */
  var header = doc.querySelector(".site-header");
  var toTop = doc.querySelector("[data-to-top]");

  function onScroll() {
    var y = window.scrollY || 0;
    if (header) header.classList.toggle("is-scrolled", y > 8);
    if (toTop) toTop.classList.toggle("is-visible", y > 600);
  }

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* --- 网址目录：搜索（按分组过滤） ------------------------------------- */
  var directory = doc.querySelector("[data-directory]");

  if (directory) {
    var cards = Array.prototype.slice.call(
      directory.querySelectorAll("[data-site]")
    );
    var groups = Array.prototype.slice.call(
      directory.querySelectorAll("[data-group]")
    );
    var search = doc.querySelector("[data-search]");
    var clearBtn = doc.querySelector("[data-clear]");
    var countEl = doc.querySelector("[data-result-count]");
    var emptyEl = doc.querySelector("[data-empty-state]");
    var emptyTerm = doc.querySelector("[data-empty-term]");
    var state = { q: "" };

    /* 判断一张卡片是否命中关键词：站名 + 标签 + 可见文本，全部转小写后做包含匹配。
       这是“搜索”的核心，只读 DOM，不发请求。 */
    function matches(card) {
      if (!state.q) return true;
      var haystack = (
        card.getAttribute("data-name") +
        " " +
        card.getAttribute("data-tags") +
        " " +
        card.textContent
      ).toLowerCase();
      return haystack.indexOf(state.q) !== -1;
    }

    /* 真正执行过滤：
       1. 逐张卡片设置 hidden；
       2. 某组一张都不剩时，整组隐藏；
       3. 更新“显示 X / 26”和空状态；
       4. 把关键词写进地址栏 ?q=，方便分享。
       pushUrl=false 用于页面刚打开时，避免多余的历史记录。 */
    function apply(pushUrl) {
      var shown = 0;

      cards.forEach(function (card) {
        var ok = matches(card);
        card.hidden = !ok;
        card.parentNode.hidden = !ok;
        if (ok) shown += 1;
      });

      groups.forEach(function (group) {
        var visible = group.querySelectorAll("[data-site]:not([hidden])").length;
        group.hidden = visible === 0;
        var counter = group.querySelector("[data-group-count]");
        if (counter) counter.textContent = visible + " sites";
      });

      if (countEl) {
        countEl.textContent =
          "Showing " + shown + " / " + cards.length + " sites" +
          (state.q ? " · query “" + state.q + "”" : "");
      }
      if (emptyEl) emptyEl.hidden = shown !== 0;
      if (emptyTerm) emptyTerm.textContent = state.q || "";
      if (clearBtn) clearBtn.classList.toggle("is-visible", Boolean(state.q));

      if (pushUrl && window.history.replaceState) {
        var query = state.q ? "?q=" + encodeURIComponent(state.q) : "";
        window.history.replaceState(
          null,
          "",
          window.location.pathname + query
        );
      }
    }

    /* 页面加载时读取 ?q=：从分享链接进入也能还原搜索结果。 */
    function fromUrl() {
      var params = new URLSearchParams(window.location.search);
      var q = params.get("q") || "";
      state.q = q.trim().toLowerCase();
      if (search) search.value = q;
      apply(false);
    }

    if (search) {
      search.addEventListener("input", function () {
        state.q = search.value.trim().toLowerCase();
        apply(true);
      });

      doc.addEventListener("keydown", function (event) {
        if (event.key === "/" && doc.activeElement !== search) {
          event.preventDefault();
          search.focus();
        }
        if (event.key === "Escape" && doc.activeElement === search && search.value) {
          search.value = "";
          state.q = "";
          apply(true);
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        if (search) search.value = "";
        state.q = "";
        apply(true);
        if (search) search.focus();
      });
    }

    fromUrl();
  }

  /* --- 推荐网址表单 ------------------------------------------------------ */
  var form = doc.querySelector("[data-submit-form]");

  if (form) {
    var statusEl = form.querySelector("[data-form-status]");
    var email = form.getAttribute("data-mailto") || "";
    var urlField = form.elements.url;

    function setError(field, message) {
      var error = doc.getElementById(field.id + "-error");
      field.setAttribute("aria-invalid", message ? "true" : "false");
      if (error) {
        error.textContent = message || "";
        error.classList.toggle("is-visible", Boolean(message));
      }
    }

    function isValidUrl(value) {
      try {
        var parsed = new URL(value);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch (err) {
        return false;
      }
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var name = form.elements.name;
      var reason = form.elements.reason;
      var valid = true;

      if (!name.value.trim()) {
        setError(name, "Please enter the site name.");
        valid = false;
      } else {
        setError(name, "");
      }

      var url = urlField.value.trim();
      if (!url) {
        setError(urlField, "The URL cannot be empty.");
        valid = false;
      } else if (!isValidUrl(url)) {
        setError(urlField, "Use a full URL starting with http:// or https://.");
        valid = false;
      } else {
        setError(urlField, "");
      }

      if (reason.value.trim().length < 8) {
        setError(reason, "Write at least 8 characters about why it is useful.");
        valid = false;
      } else {
        setError(reason, "");
      }

      if (!valid) {
        if (statusEl) {
          statusEl.textContent = "A few fields need attention.";
          statusEl.className = "form-status is-error";
        }
        var firstBad = form.querySelector('[aria-invalid="true"]');
        if (firstBad) firstBad.focus();
        return;
      }

      var subject = encodeURIComponent("[Shiye Nav] Site suggestion: " + name.value.trim());
      var body = encodeURIComponent(
        "Site: " + name.value.trim() +
        "\nURL: " + url +
        "\nCategory: " + form.elements.category.value +
        "\nWhy: " + reason.value.trim()
      );
      /* 校验全部通过：拼一封邮件交给系统邮件客户端。
         静态站没有后端，这是“提交”最轻的做法。 */
      window.location.href = "mailto:" + email + "?subject=" + subject + "&body=" + body;

      if (statusEl) {
        statusEl.textContent = "Opening your email app…";
        statusEl.className = "form-status";
      }
    });

    Array.prototype.forEach.call(
      form.querySelectorAll("input, textarea"),
      function (field) {
        field.addEventListener("input", function () {
          if (field.getAttribute("aria-invalid") === "true") setError(field, "");
        });
      }
    );
  }

  /* --- 滚动出现 ---------------------------------------------------------- */
  var reveals = Array.prototype.slice.call(doc.querySelectorAll(".reveal"));

  if ("IntersectionObserver" in window && reveals.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    reveals.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    reveals.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* --- 年份 -------------------------------------------------------------- */
  Array.prototype.forEach.call(doc.querySelectorAll("[data-year]"), function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
