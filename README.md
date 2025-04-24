# Image Deblurring App

This is a Next.js application that demonstrates image deblurring functionality. The app allows users to upload blurry images and processes them to create sharper, clearer versions.

## Key Features

- Upload and process images
- View side-by-side comparison of original and processed images
- Download processed images

## Image Processing Flow

1. User uploads an image through the web interface
2. The image is sent directly to the processing API (no Vercel Blob storage)
3. The API processes the image (or uses a fallback if processing fails)
4. Results are displayed to the user

## API Endpoints

- `/api/deblur/direct` - Accepts direct image uploads and processes them
- `/api/images/[id]/[type]` - Serves the original or processed images
- `/api/results/[id]` - Provides metadata about processed images

## Implementation Details

### In-Memory Storage

This application uses in-memory storage for image data. In a production environment, you should replace this with:

- Database storage (e.g., PostgreSQL with bytea type)
- Cloud storage solutions (e.g., AWS S3, Google Cloud Storage)
- Redis or other caching mechanisms

### Python API Integration

The application is designed to connect to an external Python API for image processing. Configure the connection by setting the `PYTHON_API_URL` environment variable.

## Environment Variables

- `PYTHON_API_URL`: URL for the Python deblurring API

## Development

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

## Production Considerations

Before deploying to production, consider these improvements:

1. Implement proper storage for images (not in-memory)
2. Add user authentication and rate limiting
3. Set up proper error handling and logging
4. Implement image size and type validation
5. Add progress indicators for long-running processes