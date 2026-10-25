const cloudinary = require('cloudinary').v2;

function isConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

function getClient() {
  if (!isConfigured()) {
    const error = new Error('Image uploads are not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env.');
    error.status = 503;
    throw error;
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

function uploadImage(buffer, folder) {
  const client = getClient();
  return new Promise((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      { folder: `collabx/${folder}`, resource_type: 'image', overwrite: false },
      (error, result) => {
        if (error) {
          if (error.http_code === 401 || /invalid signature/i.test(error.message || '')) {
            const credentialsError = new Error('Cloudinary rejected the configured credentials. Verify CLOUDINARY_API_SECRET in backend/.env against the current Cloudinary dashboard value.');
            credentialsError.status = 503;
            return reject(credentialsError);
          }
          return reject(error);
        }
        if (!result?.secure_url || !result?.public_id) {
          return reject(new Error('Image hosting did not return a valid image URL.'));
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

async function deleteImage(publicId) {
  if (!publicId || !isConfigured()) return;
  await getClient().uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
}

module.exports = { deleteImage, uploadImage };
