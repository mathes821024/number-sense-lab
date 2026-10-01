import path from "node:path";
import { defineConfig } from "@tarojs/cli";

// One Taro project for the shared pages in app/. The learning core in src/
// and the content stay where they are and are compiled in, not copied.
const root = path.resolve(__dirname, "..");
const shared = [path.join(root, "src")];

// The repo's package.json is "type": "module". Webpack would then demand
// fully specified ESM imports, which Taro's own runtime imports are not.
function looseEsm(chain) {
  chain.module.rule("loose-esm").test(/\.m?jsx?$/).resolve.set("fullySpecified", false);
}

export default defineConfig(async (merge) => {
  const env = process.env.TARO_ENV;
  const base = {
    projectName: "number-sense-lab",
    date: "2026-10-1",
    designWidth: 375,
    deviceRatio: { 375: 2, 640: 2.34 / 2, 750: 1, 828: 1.81 / 2 },
    sourceRoot: "app",
    outputRoot: `dist/${env}`,
    plugins: [],
    defineConstants: {},
    // H5 page icons: the pack's small app-icon copies (manifest brand.appIconSmall / brand.touchIcon).
    copy: {
      patterns:
        env === "h5"
          ? [
              { from: "assets/brand/app-icon-32.png", to: "dist/h5/assets/brand/app-icon-32.png" },
              { from: "assets/brand/app-icon-180.png", to: "dist/h5/assets/brand/app-icon-180.png" },
            ]
          : [],
      options: {},
    },
    framework: "react",
    compiler: "webpack5",
    cache: { enable: false },
    mini: {
      compile: { include: shared },
      imageUrlLoaderOption: { limit: 0 },
      webpackChain: looseEsm,
      postcss: {
        pxtransform: { enable: true, config: {} },
        cssModules: { enable: false },
      },
    },
    h5: {
      publicPath: "./",
      staticDirectory: "static",
      router: { mode: "hash" },
      compile: { include: shared },
      webpackChain: looseEsm,
      imageUrlLoaderOption: { limit: 0 },
      output: {
        filename: "js/[name].[hash:8].js",
        chunkFilename: "js/[name].[chunkhash:8].js",
      },
      miniCssExtractPluginOption: {
        ignoreOrder: true,
        filename: "css/[name].[hash].css",
        chunkFilename: "css/[name].[chunkhash].css",
      },
      postcss: {
        // H5 keeps real px; layout widths come from media queries, not rem scaling.
        pxtransform: { enable: false, config: {} },
        autoprefixer: { enable: true, config: {} },
        cssModules: { enable: false },
      },
    },
  };
  return merge({}, base, process.env.NODE_ENV === "development" ? { mini: {}, h5: {} } : {});
});
