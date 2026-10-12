// babel-preset-taro options: https://docs.taro.zone/docs/next/babel-config
module.exports = {
  presets: [["taro", { framework: "react", ts: false, compiler: "webpack5" }]],
  plugins: [
    "@babel/plugin-proposal-optional-chaining",
    "@babel/plugin-proposal-nullish-coalescing-operator",
  ],
};
