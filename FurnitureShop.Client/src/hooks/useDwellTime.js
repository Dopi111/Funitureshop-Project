// src/hooks/useDwellTime.js
//
// PROMPT 2: Hook theo dõi thời gian khách hàng đọc trang sản phẩm (Dwell Time).
//
// Cách hoạt động:
//   1. Khi component mount → ghi nhận startTime + gọi POST /view để lấy viewId
//   2. Khi tab bị đóng, ẩn (visibilitychange) hoặc unload (pagehide) →
//      tính duration → dùng navigator.sendBeacon gửi ngầm về backend
//
// Tại sao dùng sendBeacon thay vì fetch?
//   - sendBeacon gửi fire-and-forget KHÔNG block tab đóng
//   - Browser cam kết deliver ngay cả khi page đang unload
//   - fetch với keepalive cũng được nhưng có giới hạn 64KB body

import { useEffect, useRef } from 'react';

/**
 * @param {number|string} productId  - ID sản phẩm đang xem
 * @param {boolean}       enabled    - Cho phép tracking (false khi loading)
 */
export function useDwellTime(productId, enabled = true) {
  // Ref lưu viewId trả về từ POST /view (để cập nhật đúng bản ghi)
  const viewIdRef   = useRef(null);
  // Ref lưu thời điểm bắt đầu xem (ms)
  const startRef    = useRef(null);
  // Ref lưu tổng giây đã tính (khi tab ẩn rồi hiện lại)
  const totalSecRef = useRef(0);

  // ─── Bước 1: Track view + ghi nhận startTime ───────────────────
  useEffect(() => {
    if (!productId || !enabled) return;

    startRef.current    = Date.now();
    totalSecRef.current = 0;

    // Gọi POST /view để backend biết có người vào xem
    fetch(`/api/products/${productId}/view`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        // Lưu viewId để sendBeacon dùng sau
        if (data?.viewId) viewIdRef.current = data.viewId;
      })
      .catch(() => { /* Bỏ qua lỗi — tracking là optional */ });

    // Cleanup: khi chuyển sản phẩm → flush dwell time trước
    return () => {
      flushDwellTime(productId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, enabled]);

  // ─── Bước 2: Xử lý tab ẩn / hiện (Page Visibility API) ────────
  useEffect(() => {
    if (!productId || !enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Tab bị ẩn → tích lũy thời gian xem
        if (startRef.current) {
          const elapsed = Math.round((Date.now() - startRef.current) / 1000);
          totalSecRef.current += elapsed;
          startRef.current = null; // Dừng đếm
          flushDwellTime(productId); // Gửi ngay — có thể tab bị đóng
        }
      } else if (document.visibilityState === 'visible') {
        // Tab hiện lại → bắt đầu đếm lại
        startRef.current = Date.now();
      }
    };

    // pagehide: đáng tin cậy hơn beforeunload trên mobile
    const handlePageHide = () => {
      if (startRef.current) {
        const elapsed = Math.round((Date.now() - startRef.current) / 1000);
        totalSecRef.current += elapsed;
        startRef.current = null;
      }
      flushDwellTime(productId);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, enabled]);

  // ─── Helper: Gửi dữ liệu ngầm qua sendBeacon ──────────────────
  function flushDwellTime(pid) {
    // Cộng thêm thời gian từ lần startRef hiện tại (nếu còn đang chạy)
    let finalSecs = totalSecRef.current;
    if (startRef.current) {
      finalSecs += Math.round((Date.now() - startRef.current) / 1000);
    }

    // Chỉ gửi nếu đọc ít nhất 2 giây (loại bỏ bounce)
    if (finalSecs < 2) return;

    const payload = JSON.stringify({
      productId:         pid,
      durationInSeconds: Math.min(finalSecs, 7200), // Giới hạn 2 giờ
      viewId:            viewIdRef.current ?? null
    });

    // sendBeacon yêu cầu Blob với type text/plain để tránh preflight CORS
    const blob = new Blob([payload], { type: 'text/plain' });

    const sent = navigator.sendBeacon('/api/analytics/update-duration', blob);

    if (!sent) {
      // Fallback: fetch với keepalive nếu sendBeacon thất bại (hiếm)
      fetch('/api/analytics/update-duration', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    payload,
        keepalive: true // Cho phép gửi sau khi page unload
      }).catch(() => {});
    }

    // Reset để tránh gửi 2 lần
    totalSecRef.current = 0;
    startRef.current    = null;
  }
}
