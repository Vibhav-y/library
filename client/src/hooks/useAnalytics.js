export const useAnalytics = () => {
  const trackEvent = (eventName, params = {}) => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
    }
  };

  const trackPageView = (page) => {
    if (typeof window.gtag === 'function') {
      window.gtag('config', 'G-R79LF4Y78F', {
        page_path: page
      });
    }
  };

  return {
    trackEvent,
    trackPageView
  };
};