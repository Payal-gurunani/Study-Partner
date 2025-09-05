import { asyncHandler } from "../utils/asyncHandler.js";
import { Note } from "../model/note.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import cloudinary from "../utils/cloudinary.js";
// Helper to upload PDF to Cloudinary and return URL
const uploadPdfToCloudinary = (buffer, filename) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "raw", folder: "pdf-notes", public_id: filename },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};

export const uploadPdfNote = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No PDF file uploaded");
  }

  const pdfBuffer = req.file.buffer;
  const pdfData = await pdfParse(pdfBuffer);
  const { subject, tags = [] } = req.body;
  const tagsArray = typeof tags === "string" ? tags.split(",").map(t => t.trim()) : tags;

  // Upload PDF to Cloudinary
  const pdfUrl = await uploadPdfToCloudinary(pdfBuffer, req.file.originalname.split(".")[0]);

  const note = await Note.create({
    title: req.file.originalname,
    content: pdfData.text,
    subject,
    tags: tagsArray,
    user: req.user._id,
    isPdf: true,
    pdfPath: pdfUrl, // Cloudinary URL
  });

  res.status(201).json(new ApiResponse(201, note, "PDF note uploaded"));
});
