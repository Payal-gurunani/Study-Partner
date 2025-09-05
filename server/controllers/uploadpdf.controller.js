import { asyncHandler } from "../utils/asyncHandler.js";
import { Note } from "../model/note.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import pdfParse from "pdf-parse";
import cloudinary from "../config/cloudinary.js";

export const uploadPdfNote = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No PDF file uploaded");
  }

  const pdfBuffer = req.file.buffer;
  const pdfData = await pdfParse(pdfBuffer);

  // Upload PDF to Cloudinary
  const result = await cloudinary.uploader.upload_stream(
    { resource_type: "raw", folder: "pdf-notes" }, // "raw" for PDFs
    async (error, result) => {
      if (error) throw new ApiError(500, "Cloudinary upload failed");

      const { subject, tags = [] } = req.body;
      const tagsArray = typeof tags === "string" ? tags.split(",").map(t => t.trim()) : tags;

      const note = await Note.create({
        title: req.file.originalname,
        content: pdfData.text,
        subject,
        tags: tagsArray,
        user: req.user._id,
        isPdf: true,
        pdfPath: result.secure_url, // Cloudinary PDF URL
      });

      res.status(201).json(new ApiResponse(201, note, "PDF note uploaded"));
    }
  );

  // Pipe the file buffer to Cloudinary
  result.end(pdfBuffer);
});
