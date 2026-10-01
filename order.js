/*************************************************
 * MỘC TRÀ - ORDER.JS
 *
 * Không dùng fetch()
 * Không dùng CORS
 *
 * Gửi đơn:
 * HTML Form → Apps Script → Google Sheet
 *                         ↓
 *                    postMessage
 *************************************************/


const ORDER_API_URL =
  "https://script.google.com/macros/s/AKfycbwGYaRJSAjmxNXQEs2dmpKGJkdd2P7TuP8ateEQvxtWBqONFXx74i5jqjiX1r2e9z33/exec";


/* =================================================
   STATE
================================================= */

const orderState = {

  selected: {
    weight: "1kg",
    price: 350000
  },

  qty: 1,

  submitting: false

};


/* =================================================
   FORMAT TIỀN
================================================= */

function formatMoney(value) {

  value = Number(value || 0);

  return value.toLocaleString("vi-VN") + "đ";
}


/* =================================================
   TÌM ELEMENT
================================================= */

function $(id) {

  return document.getElementById(id);

}


/* =================================================
   RENDER TÓM TẮT ĐƠN
================================================= */

function renderOrderSummary() {

  const weight = orderState.selected.weight;

  const price = Number(orderState.selected.price);

  const qty = Number(orderState.qty);

  const total = price * qty;


  // Sản phẩm

  const summaryProduct = $("summaryProduct");

  if (summaryProduct) {

    summaryProduct.textContent =
      "Chè Shan Tuyết cổ thụ – " + weight;

  }


  // Giá

  const summaryPrice = $("summaryPrice");

  if (summaryPrice) {

    summaryPrice.textContent =
      formatMoney(price);

  }


  // Quantity

  const qtyValue = $("qtyValue");

  if (qtyValue) {

    qtyValue.textContent = qty;

  }


  // Tổng

  const summaryTotal = $("summaryTotal");

  if (summaryTotal) {

    summaryTotal.textContent =
      formatMoney(total);

  }


  // Sticky price

  const stickyPrice = $("stickyPrice");

  if (stickyPrice) {

    stickyPrice.textContent =
      formatMoney(total);

  }

}


/* =================================================
   CHỌN SẢN PHẨM
================================================= */

function setupProductOptions() {

  const options = document.querySelectorAll(
    "[data-weight][data-price]"
  );


  if (!options.length) {

    console.warn(
      "MỘC TRÀ: Không tìm thấy product options."
    );

    return;

  }


  function selectOption(option) {

    const weight =
      option.dataset.weight;

    const price =
      Number(option.dataset.price);


    orderState.selected = {
      weight: weight,
      price: price
    };


    options.forEach(function(item) {

      item.classList.remove(
        "active",
        "selected"
      );

    });


    option.classList.add("active");


    renderOrderSummary();

  }


  options.forEach(function(option) {

    option.addEventListener(
      "click",
      function() {

        selectOption(option);

      }
    );

  });


  // Tìm option đang active

  let activeOption =
    Array.from(options).find(function(option) {

      return option.classList.contains("active") ||
             option.classList.contains("selected");

    });


  // Nếu không có → mặc định 1kg

  if (!activeOption) {

    activeOption =
      Array.from(options).find(function(option) {

        return option.dataset.weight === "1kg";

      });

  }


  if (!activeOption) {

    activeOption = options[0];

  }


  selectOption(activeOption);

}


/* =================================================
   QUANTITY
================================================= */

function setupQuantity() {

  const minus = $("qtyMinus");

  const plus = $("qtyPlus");

  const qtyValue = $("qtyValue");


  if (!minus || !plus) {

    return;

  }


  function updateQty() {

    if (qtyValue) {

      qtyValue.textContent =
        orderState.qty;

    }

    renderOrderSummary();

  }


  minus.addEventListener(
    "click",
    function() {

      if (orderState.qty > 1) {

        orderState.qty--;

        updateQty();

      }

    }
  );


  plus.addEventListener(
    "click",
    function() {

      if (orderState.qty < 99) {

        orderState.qty++;

        updateQty();

      }

    }
  );


  updateQty();

}


/* =================================================
   VALIDATE PHONE
================================================= */

function validatePhone(phone) {

  const cleanPhone =
    String(phone || "")
      .replace(/\s+/g, "")
      .replace(/^\+84/, "0");


  return /^(0)(3|5|7|8|9)[0-9]{8}$/
    .test(cleanPhone);

}


/* =================================================
   MARKETING / UTM
================================================= */

function getMarketingData() {

  const params =
    new URLSearchParams(
      window.location.search
    );


  return {

    source:
      params.get("utm_source") || "",

    medium:
      params.get("utm_medium") || "",

    campaign:
      params.get("utm_campaign") || "",

    content:
      params.get("utm_content") || "",

    pageUrl:
      window.location.href

  };

}


/* =================================================
   TẠO IFRAME ẨN
================================================= */

function createOrderIframe() {

  let iframe =
    document.getElementById(
      "mocTraOrderIframe"
    );


  if (iframe) {

    return iframe;

  }


  iframe =
    document.createElement("iframe");


  iframe.id =
    "mocTraOrderIframe";

  iframe.name =
    "mocTraOrderIframe";

  iframe.style.position =
    "fixed";

  iframe.style.width =
    "1px";

  iframe.style.height =
    "1px";

  iframe.style.border =
    "0";

  iframe.style.opacity =
    "0";

  iframe.style.pointerEvents =
    "none";

  iframe.style.left =
    "-9999px";

  iframe.style.top =
    "-9999px";


  iframe.setAttribute(
    "aria-hidden",
    "true"
  );


  document.body.appendChild(iframe);


  return iframe;

}


/* =================================================
   SET LOADING BUTTON
================================================= */

function setSubmitLoading(loading) {

  const button =
    $("submitOrderBtn");


  if (!button) {

    return;

  }


  if (loading) {

    button.dataset.originalText =
      button.innerHTML;


    button.disabled = true;

    button.style.pointerEvents =
      "none";

    button.style.opacity =
      "0.7";


    button.innerHTML =
      "⏳ ĐANG GỬI ĐƠN...";


  } else {

    button.disabled = false;

    button.style.pointerEvents =
      "";

    button.style.opacity =
      "";


    if (button.dataset.originalText) {

      button.innerHTML =
        button.dataset.originalText;

    }

  }

}


/* =================================================
   TẠO FORM POST ẨN
================================================= */

function createHiddenForm(data) {

  const iframe =
    createOrderIframe();


  const form =
    document.createElement("form");


  form.method =
    "POST";


  form.action =
    ORDER_API_URL;


  form.target =
    iframe.name;


  form.style.display =
    "none";


  /*
   * Các field này sẽ trở thành
   * e.parameter trong Apps Script.
   */

  Object.keys(data).forEach(
    function(key) {

      const input =
        document.createElement("input");


      input.type =
        "hidden";


      input.name =
        key;


      input.value =
        data[key] == null
          ? ""
          : String(data[key]);


      form.appendChild(input);

    }
  );


  document.body.appendChild(form);


  return form;

}


/* =================================================
   GỬI ĐƠN
================================================= */

function sendOrderToGoogleSheet(data) {

  return new Promise(
    function(resolve, reject) {

      let finished = false;


      function cleanup() {

        window.removeEventListener(
          "message",
          messageHandler
        );


        if (form && form.parentNode) {

          form.parentNode.removeChild(form);

        }

      }


      function finishSuccess(result) {

        if (finished) {

          return;

        }


        finished = true;

        clearTimeout(timeout);

        cleanup();

        resolve(result);

      }


      function finishError(error) {

        if (finished) {

          return;

        }


        finished = true;

        clearTimeout(timeout);

        cleanup();

        reject(error);

      }


      function messageHandler(event) {

        const result =
          event.data;


        if (!result) {

          return;

        }


        if (
          result.type !==
          "MOC_TRA_ORDER_RESULT"
        ) {

          return;

        }


        if (result.success) {

          finishSuccess(result);

        } else {

          finishError(
            new Error(
              result.message ||
              "Không thể ghi đơn hàng."
            )
          );

        }

      }


      window.addEventListener(
        "message",
        messageHandler
      );


      const form =
        createHiddenForm(data);


      /*
       * Timeout 30 giây.
       *
       * Không tự động gửi lại để tránh
       * tạo đơn trùng.
       */

      const timeout =
        setTimeout(
          function() {

            finishError(
              new Error(
                "Máy chủ không phản hồi sau 30 giây. Vui lòng kiểm tra Google Sheet trước khi gửi lại."
              )
            );

          },
          30000
        );


      try {

        form.submit();

      } catch (error) {

        finishError(error);

      }

    }
  );

}


/* =================================================
   HIỆN THÀNH CÔNG
================================================= */

function showOrderSuccess(result) {

  console.log(
    "MỘC TRÀ - ORDER SUCCESS:",
    result
  );


  /*
   * Nếu HTML hiện tại có hàm
   * showOrderSuccess riêng thì ưu tiên
   * gọi nó.
   */

  if (
    typeof window.showOrderSuccessUI ===
    "function"
  ) {

    window.showOrderSuccessUI(result);

    return;

  }


  const success =
    $("success");


  if (success) {

    success.style.display =
      "block";


    success.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });


    /*
     * Nếu trong success có element
     * hiển thị mã đơn.
     */

    const orderCodeElements =
      success.querySelectorAll(
        "[data-order-code]"
      );


    orderCodeElements.forEach(
      function(el) {

        el.textContent =
          result.orderCode || "";

      }
    );

  }

}


/* =================================================
   RESET FORM
================================================= */

function resetOrder() {

  const form =
    $("orderForm");


  if (form) {

    form.reset();

  }


  orderState.qty = 1;


  renderOrderSummary();

}


/* =================================================
   SETUP FORM
================================================= */

function setupOrderForm() {

  const form =
    $("orderForm");


  if (!form) {

    console.warn(
      "MỘC TRÀ: Không tìm thấy #orderForm"
    );

    return;

  }


  form.addEventListener(
    "submit",
    async function(event) {

      /*
       * QUAN TRỌNG:
       * Chặn submit mặc định.
       */

      event.preventDefault();


      if (orderState.submitting) {

        return;

      }


      // ==============================
      // LẤY THÔNG TIN
      // ==============================

      const nameInput =
        $("name");

      const phoneInput =
        $("phone");

      const addressInput =
        $("address");


      const name =
        nameInput
          ? nameInput.value.trim()
          : "";


      const phone =
        phoneInput
          ? phoneInput.value.trim()
          : "";


      const address =
        addressInput
          ? addressInput.value.trim()
          : "";


      // ==============================
      // VALIDATE
      // ==============================

      if (!name) {

        alert(
          "Vui lòng nhập họ tên."
        );

        if (nameInput) {

          nameInput.focus();

        }

        return;

      }


      if (!phone) {

        alert(
          "Vui lòng nhập số điện thoại."
        );

        if (phoneInput) {

          phoneInput.focus();

        }

        return;

      }


      if (!validatePhone(phone)) {

        alert(
          "Số điện thoại không hợp lệ. Vui lòng kiểm tra lại."
        );

        if (phoneInput) {

          phoneInput.focus();

        }

        return;

      }


      if (!address) {

        alert(
          "Vui lòng nhập địa chỉ nhận hàng."
        );

        if (addressInput) {

          addressInput.focus();

        }

        return;

      }


      // ==============================
      // ORDER DATA
      // ==============================

      const weight =
        orderState.selected.weight;


      const quantity =
        Number(orderState.qty);


      const unitPrice =
        Number(orderState.selected.price);


      const total =
        unitPrice * quantity;


      const marketing =
        getMarketingData();


      const order = {

        name: name,

        phone: phone,

        address: address,

        product:
          "Chè Shan Tuyết cổ thụ",

        weight: weight,

        quantity: quantity,

        unitPrice: unitPrice,

        total: total,

        source:
          marketing.source,

        medium:
          marketing.medium,

        campaign:
          marketing.campaign,

        content:
          marketing.content,

        pageUrl:
          marketing.pageUrl

      };


      console.log(
        "MỘC TRÀ - ORDER DATA:",
        order
      );


      // ==============================
      // LOCK SUBMIT
      // ==============================

      orderState.submitting =
        true;


      setSubmitLoading(true);


      try {

        const result =
          await sendOrderToGoogleSheet(
            order
          );


        console.log(
          "MỘC TRÀ - ORDER SUCCESS:",
          result
        );


        /*
         * Thành công thật sự:
         * Apps Script đã appendRow().
         */

        showOrderSuccess(result);


        /*
         * Reset sau khi thành công.
         */

        resetOrder();


      } catch (error) {

        console.error(
          "MỘC TRÀ - ORDER ERROR:",
          error
        );


        alert(
          error && error.message
            ? error.message
            : "Không thể gửi đơn hàng. Vui lòng thử lại."
        );


      } finally {

        orderState.submitting =
          false;

        setSubmitLoading(false);

      }

    }
  );

}


/* =================================================
   INIT
================================================= */

function initMocTraOrder() {

  try {

    setupProductOptions();

    setupQuantity();

    setupOrderForm();

    renderOrderSummary();


    console.log(
      "MỘC TRÀ - Order system ready."
    );


  } catch (error) {

    console.error(
      "MỘC TRÀ - INIT ERROR:",
      error
    );

  }

}


/* =================================================
   PUBLIC API
================================================= */

window.MocTraOrder = {

  formatMoney:
    formatMoney,

  renderOrderSummary:
    renderOrderSummary,

  resetOrder:
    resetOrder,

  sendOrder:
    sendOrderToGoogleSheet

};


/* =================================================
   START
================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initMocTraOrder
  );

} else {

  initMocTraOrder();

}