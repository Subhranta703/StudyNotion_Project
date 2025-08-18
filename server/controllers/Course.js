const Course = require("../models/Course")
const Section = require("../models/Section")
const SubSection = require("../models/Subsection")
const User = require("../models/User")
const { uploadImageToCloudinary } = require("../utils/imageUploader")
const CourseProgress = require("../models/CourseProgress")
const { convertSecondsToDuration } = require("../utils/secToDuration")

// ✅ manual categories instead of DB model
const ALLOWED_CATEGORIES = ["Web Development", "Data Science", "AI/ML", "Design", "Marketing"]

// ----------------- CREATE COURSE -----------------
exports.createCourse = async (req, res) => {
  try {
    const userId = req.user.id
    let {
      courseName,
      courseDescription,
      whatYouWillLearn,
      price,
      tag: _tag,
      category,
      status,
      instructions: _instructions,
    } = req.body

    const thumbnail = req.files?.thumbnailImage
    if (!thumbnail) {
      return res.status(400).json({ success: false, message: "Thumbnail image is required" })
    }

    const tag = JSON.parse(_tag || "[]")
    const instructions = JSON.parse(_instructions || "[]")

    if (!courseName || !courseDescription || !whatYouWillLearn || !price || !tag.length || !category || !instructions.length) {
      return res.status(400).json({ success: false, message: "All Fields are Mandatory" })
    }

    if (!status) status = "Draft"

    const instructorDetails = await User.findById(userId)
    if (!instructorDetails || instructorDetails.accountType !== "Instructor") {
      return res.status(404).json({ success: false, message: "Instructor Details Not Found" })
    }

    if (!ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Allowed: ${ALLOWED_CATEGORIES.join(", ")}`,
      })
    }

    const thumbnailImage = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME)

    const newCourse = await Course.create({
      courseName,
      courseDescription,
      instructor: instructorDetails._id,
      whatYouWillLearn,
      price,
      tag,
      category, // ✅ stored as string
      thumbnail: thumbnailImage.secure_url,
      status,
      instructions,
    })

    await User.findByIdAndUpdate(instructorDetails._id, { $push: { courses: newCourse._id } }, { new: true })

    res.status(200).json({ success: true, data: newCourse, message: "Course Created Successfully" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Failed to create course", error: error.message })
  }
}

// ----------------- EDIT COURSE -----------------
exports.editCourse = async (req, res) => {
  try {
    const { courseId } = req.body
    const updates = req.body
    const course = await Course.findById(courseId)

    if (!course) return res.status(404).json({ error: "Course not found" })

    if (req.files?.thumbnailImage) {
      const thumbnailImage = await uploadImageToCloudinary(req.files.thumbnailImage, process.env.FOLDER_NAME)
      course.thumbnail = thumbnailImage.secure_url
    }

    for (const key in updates) {
      if (key === "tag" || key === "instructions") {
        course[key] = JSON.parse(updates[key])
      } else {
        course[key] = updates[key]
      }
    }

    await course.save()

    const updatedCourse = await Course.findById(courseId)
      .populate({ path: "instructor", populate: { path: "additionalDetails" } })
      .populate("ratingAndReviews")
      .populate({ path: "courseContent", populate: { path: "subSection" } })

    res.json({ success: true, message: "Course updated successfully", data: updatedCourse })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Internal server error", error: error.message })
  }
}

// ----------------- GET ALL COURSES -----------------
exports.getAllCourses = async (req, res) => {
  try {
    const allCourses = await Course.find({ status: "Published" }, { courseName: true, price: true, thumbnail: true, instructor: true, ratingAndReviews: true, studentsEnrolled: true })
      .populate("instructor")

    return res.status(200).json({ success: true, data: allCourses })
  } catch (error) {
    console.error(error)
    return res.status(404).json({ success: false, message: `Can't Fetch Course Data`, error: error.message })
  }
}

// ----------------- GET COURSE DETAILS -----------------
exports.getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body
    const courseDetails = await Course.findById(courseId)
      .populate({ path: "instructor", populate: { path: "additionalDetails" } })
      .populate("ratingAndReviews")
      .populate({ path: "courseContent", populate: { path: "subSection", select: "-videoUrl" } })

    if (!courseDetails) return res.status(400).json({ success: false, message: `Could not find course with id: ${courseId}` })

    let totalDurationInSeconds = 0
    courseDetails.courseContent.forEach(content => {
      content.subSection.forEach(subSection => {
        totalDurationInSeconds += parseInt(subSection.timeDuration || 0)
      })
    })

    const totalDuration = convertSecondsToDuration(totalDurationInSeconds)

    return res.status(200).json({ success: true, data: { courseDetails, totalDuration } })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

// ----------------- GET FULL COURSE DETAILS -----------------
exports.getFullCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body
    const userId = req.user.id
    const courseDetails = await Course.findById(courseId)
      .populate({ path: "instructor", populate: { path: "additionalDetails" } })
      .populate("ratingAndReviews")
      .populate({ path: "courseContent", populate: { path: "subSection" } })

    if (!courseDetails) return res.status(400).json({ success: false, message: `Could not find course with id: ${courseId}` })

    let courseProgressCount = await CourseProgress.findOne({ courseID: courseId, userId })

    let totalDurationInSeconds = 0
    courseDetails.courseContent.forEach(content => {
      content.subSection.forEach(subSection => {
        totalDurationInSeconds += parseInt(subSection.timeDuration || 0)
      })
    })

    const totalDuration = convertSecondsToDuration(totalDurationInSeconds)

    return res.status(200).json({
      success: true,
      data: {
        courseDetails,
        totalDuration,
        completedVideos: courseProgressCount?.completedVideos || [],
      },
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

// ----------------- GET INSTRUCTOR COURSES -----------------
exports.getInstructorCourses = async (req, res) => {
  try {
    const instructorId = req.user.id
    const instructorCourses = await Course.find({ instructor: instructorId }).sort({ createdAt: -1 })
    res.status(200).json({ success: true, data: instructorCourses })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Failed to retrieve instructor courses", error: error.message })
  }
}

// ----------------- DELETE COURSE -----------------
exports.deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.body
    const course = await Course.findById(courseId)
    if (!course) return res.status(404).json({ message: "Course not found" })

    for (const studentId of course.studentsEnrolled) {
      await User.findByIdAndUpdate(studentId, { $pull: { courses: courseId } })
    }

    for (const sectionId of course.courseContent) {
      const section = await Section.findById(sectionId)
      if (section) {
        for (const subSectionId of section.subSection) {
          await SubSection.findByIdAndDelete(subSectionId)
        }
      }
      await Section.findByIdAndDelete(sectionId)
    }

    await Course.findByIdAndDelete(courseId)
    return res.status(200).json({ success: true, message: "Course deleted successfully" })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: "Server error", error: error.message })
  }
}
