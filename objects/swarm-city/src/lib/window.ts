export const updateSize = () => {
  const { scrollWidth, scrollHeight } = document.body;
  parent.postMessage(
    {
      type: "window-size",
      scrollWidth,
      scrollHeight,
    },
    "*"
  );
};
