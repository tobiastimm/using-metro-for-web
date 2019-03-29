# using-metro-for-web

> A boilerplate to use 🚆 for web bundling!

This boilerplate shows how to use [`metro`](https://github.com/facebook/metro) as a web bundler.

I'm using `react` in this boilerplate, because the main use-case of metro is bundling for `react-native`. It should work with other frameworks, but would need a bit of work.

Styling is restricted to `css-in-js` only atm, because there are no transformers for css, scss, ... yet.

I`ve created a hackish [metro-css-transformer](https://github.com/tobiastimm/metro-css-transformer) for anyone interested.

Most of this is still work in progress, but I want to explore the possibilities and differences, advantages, disadvantages of bundling with `metro`.

Feel free to help or share your ideas for continuously improvement!

## Getting Started

Clone this repo

```bash
git clone https://github.com/tobiastimm/using-metro-for-web.git
```

Install dependencies

```bash
yarn install
```

Run the server

```bash
yarn start
```

## ToDo

[] HMR

[] Support for HTML, CSS, SCSS, LESS, Stylus, ...

## License

[MIT](./LICENSE)
