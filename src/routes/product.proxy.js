const { Router } = require('express');
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
const config = require('../config');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const countryScope = require('../middlewares/country-scope');

const router = Router();

const jsonParser = require('express').json();

const productProxy = createProxyMiddleware({
  target: config.productServiceUrl,
  changeOrigin: true,
  on: {
    proxyReq: fixRequestBody,
  },
});

// Restore req.url to the full originalUrl before handing off to the proxy,
// because Express strips the mount-point prefix from req.url.
const proxyForward = (req, res, next) => {
  req.url = req.originalUrl;
  productProxy(req, res, next);
};

/**
 * @swagger
 * tags:
 *   - name: Countries
 *     description: Country management — proxied to omnicore-product service
 *   - name: Products
 *     description: Product catalogue — proxied to omnicore-product service
 *   - name: Country Products
 *     description: Per-country stock and pricing — proxied to omnicore-product service
 */

// ── Country Products ───────────────────────────────────────────────────────

/**
 * @swagger
 * /api/country-products:
 *   post:
 *     tags: [Country Products]
 *     summary: Create a country-product entry (Principal, Tenant — country-scoped)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, countryId, price, currency, quantity]
 *             properties:
 *               productId:   { type: string, format: uuid }
 *               countryId:   { type: string, format: uuid }
 *               price:       { type: number, format: float, example: 29.99 }
 *               currency:    { type: string, example: EUR }
 *               quantity:    { type: integer, example: 100 }
 *               isAvailable: { type: boolean, default: true }
 *     responses:
 *       201:
 *         description: Country-product created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CountryProduct'
 *   get:
 *     tags: [Country Products]
 *     summary: List all country-product entries (all roles)
 *     responses:
 *       200:
 *         description: List of country-products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CountryProduct'
 */

/**
 * @swagger
 * /api/country-products/country/{countryId}:
 *   get:
 *     tags: [Country Products]
 *     summary: Get all products available in a specific country (all roles)
 *     parameters:
 *       - in: path
 *         name: countryId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Country-products for the given country
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CountryProduct'
 */

/**
 * @swagger
 * /api/country-products/{id}:
 *   get:
 *     tags: [Country Products]
 *     summary: Get a country-product by ID (all roles)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Country-product entry
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CountryProduct'
 *   put:
 *     tags: [Country Products]
 *     summary: Update a country-product (Principal, Tenant — country-scoped)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               price:       { type: number }
 *               currency:    { type: string }
 *               quantity:    { type: integer }
 *               isAvailable: { type: boolean }
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CountryProduct'
 *   delete:
 *     tags: [Country Products]
 *     summary: Delete a country-product (Principal, Tenant — country-scoped)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Deleted
 */

/**
 * @swagger
 * /api/country-products/{id}/stock:
 *   patch:
 *     tags: [Country Products]
 *     summary: Update stock quantity for a country-product (Principal, Tenant — country-scoped)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity: { type: integer, example: 150 }
 *     responses:
 *       200:
 *         description: Stock updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CountryProduct'
 */
router.use(
  '/api/country-products',
  authenticate,
  authorize,
  jsonParser,
  countryScope,
  proxyForward,
);

// ── Countries ──────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/countries:
 *   post:
 *     tags: [Countries]
 *     summary: Create a country (Principal only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, countryCode, currency]
 *             properties:
 *               name:        { type: string, example: France }
 *               countryCode: { type: string, example: FR }
 *               currency:    { type: string, example: EUR }
 *               isActive:    { type: boolean, default: true }
 *     responses:
 *       201:
 *         description: Country created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Country'
 *   get:
 *     tags: [Countries]
 *     summary: List all countries (all roles)
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of countries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Country'
 */

/**
 * @swagger
 * /api/countries/{id}:
 *   get:
 *     tags: [Countries]
 *     summary: Get a country by ID (all roles)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Country
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Country'
 *       404:
 *         description: Not found
 *   put:
 *     tags: [Countries]
 *     summary: Update a country (Principal only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:        { type: string }
 *               countryCode: { type: string }
 *               currency:    { type: string }
 *               isActive:    { type: boolean }
 *     responses:
 *       200:
 *         description: Updated country
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Country'
 *   delete:
 *     tags: [Countries]
 *     summary: Delete a country (Principal only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Deleted
 */
router.use(
  '/api/countries',
  authenticate,
  authorize,
  jsonParser,
  proxyForward,
);

// ── Products ───────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/products:
 *   post:
 *     tags: [Products]
 *     summary: Create a product (Principal, Tenant)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:        { type: string, example: Blue T-Shirt }
 *               description: { type: string }
 *               isActive:    { type: boolean, default: true }
 *     responses:
 *       201:
 *         description: Product created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *   get:
 *     tags: [Products]
 *     summary: List all products (all roles)
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */

/**
 * @swagger
 * /api/products/upload:
 *   post:
 *     tags: [Products]
 *     summary: Create a product with image upload to Cloudinary (Principal, Tenant)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:        { type: string }
 *               description: { type: string }
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Up to 5 image files (field name "images")
 *     responses:
 *       201:
 *         description: Product created with uploaded images
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get a product by ID with images and country stock (all roles)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Product with images and country-products
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *   put:
 *     tags: [Products]
 *     summary: Update a product (Principal, Tenant)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:        { type: string }
 *               description: { type: string }
 *               isActive:    { type: boolean }
 *     responses:
 *       200:
 *         description: Updated product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *   patch:
 *     tags: [Products]
 *     summary: Partially update a product (Principal, Tenant)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:        { type: string }
 *               description: { type: string }
 *               isActive:    { type: boolean }
 *     responses:
 *       200:
 *         description: Updated product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *   delete:
 *     tags: [Products]
 *     summary: Delete a product (Principal only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Deleted
 */

/**
 * @swagger
 * /api/products/{id}/images:
 *   post:
 *     tags: [Products]
 *     summary: Add an image URL to a product (Principal, Tenant)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [url]
 *             properties:
 *               url:       { type: string, format: uri }
 *               isPrimary: { type: boolean, default: false }
 *     responses:
 *       201:
 *         description: Image added
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductImage'
 */

/**
 * @swagger
 * /api/products/{id}/images/upload:
 *   post:
 *     tags: [Products]
 *     summary: Upload a single image to Cloudinary and attach to product (Principal, Tenant)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Single image file (field name "image")
 *     responses:
 *       201:
 *         description: Image uploaded and attached
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductImage'
 */

/**
 * @swagger
 * /api/products/{id}/images/{imageId}/primary:
 *   put:
 *     tags: [Products]
 *     summary: Set an image as the primary image for a product (Principal, Tenant)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Primary image updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductImage'
 */

/**
 * @swagger
 * /api/products/images/{imageId}:
 *   delete:
 *     tags: [Products]
 *     summary: Delete a product image (Principal only)
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Deleted
 */
router.use(
  '/api/products',
  authenticate,
  authorize,
  jsonParser,
  proxyForward,
);

module.exports = router;
