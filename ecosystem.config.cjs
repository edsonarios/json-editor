module.exports = {
  apps: [
    {
      name: 'json-editor',
      // El back ya sirve el front compilado (back/client), por eso basta un solo proceso.
      script: 'dist/main.js',
      // cwd en back/ para que @nestjs/config cargue back/.env y las rutas relativas funcionen.
      cwd: './back',
      env: {
        PORT: 4000,
      },
    },
  ],
}
