import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
// import { toast } from "react-hot-toast"
import { HiOutlineCurrencyRupee } from "react-icons/hi"
import { MdNavigateNext } from "react-icons/md"
import { useDispatch, useSelector } from "react-redux"

// import {
//   addCourseDetails,
//   editCourseDetails,
//   fetchCourseCategories,
// } from "../../../../../services/operations/courseDetailsAPI"
import { setCourse, setStep } from "../../../../../slices/courseSlice"
import { COURSE_STATUS } from "../../../../../utils/constants"
import IconBtn from "../../../../Common/IconBtn"
// import Upload from "../Upload"
import ChipInput from "./ChipInput"
import RequirementsField from "./RequirementsField"

export default function CourseInformationForm() {
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm()

  const dispatch = useDispatch()
  const { token } = useSelector((state) => state.auth)
  const { course, editCourse } = useSelector((state) => state.course)
  const [loading, setLoading] = useState(false)
  const courseCategories = [
    { _id: "1", name: "Web Development" },
    { _id: "2", name: "Data Science" },
    { _id: "3", name: "Machine Learning" },
    { _id: "4", name: "Cloud Computing" },
    { _id: "5", name: "Cyber Security" },
    { _id: "6", name: "Mobile Development" },
    { _id: "7", name: "UI/UX Design" },
  ]

  useEffect(() => {
    // const getCategories = async () => {
    //   setLoading(true)
    //   const categories = await fetchCourseCategories()
    //   
    //   if (categories.length > 0) {
    //     // console.log("categories", categories)
    //     setCourseCategories(categories)
    //   }
    //   setLoading(false)
    // }
    // if form is in edit mode
    if (editCourse) {
      // console.log("data populated", editCourse)
      setValue("courseTitle", course.courseName)
      setValue("courseShortDesc", course.courseDescription)
      setValue("coursePrice", course.price)
      setValue("courseTags", course.tag)
      setValue("courseBenefits", course.whatYouWillLearn)
      setValue("courseCategory", course.category?._id)
      setValue("courseRequirements", course.instructions)
      setValue("courseImage", course.thumbnail)
    }
    

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isFormUpdated = () => {
    const currentValues = getValues()
    // console.log("changes after editing form values:", currentValues)
    if (
      currentValues.courseTitle !== course.courseName ||
      currentValues.courseShortDesc !== course.courseDescription ||
      currentValues.coursePrice !== course.price ||
      currentValues.courseTags.toString() !== course.tag.toString() ||
      currentValues.courseBenefits !== course.whatYouWillLearn ||
      currentValues.courseCategory !== course.category._id ||
      currentValues.courseRequirements.toString() !==
        course.instructions.toString() ||
      currentValues.courseImage !== course.thumbnail
    ) {
      return true
    }
    return false
  }

  //   handle next button click
const onSubmit = async (values) => {
  try {
    const formData = new FormData();

    // required text fields
    formData.append("courseName", values.courseName);
    formData.append("courseDescription", values.courseDescription);
    formData.append("whatYouWillLearn", values.whatYouWillLearn);
    formData.append("price", values.price);

    // arrays must be stringified (backend does JSON.parse)
    formData.append("tag", JSON.stringify(values.tag || []));
    formData.append("instructions", JSON.stringify(values.instructions || []));

    // category
    formData.append("category", values.category);

    // optional status
    formData.append("status", values.status || "Draft");

    // thumbnail file (MUST match backend: thumbnailImage)
    if (values.thumbnailImage && values.thumbnailImage[0]) {
      formData.append("thumbnailImage", values.thumbnailImage[0]);
    }

    const response = await fetch("http://localhost:8000/api/v1/course/createCourse", {
      method: "POST",
      body: formData,
      credentials: "include", // 🔑 so req.user is available
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("❌ CREATE COURSE FAILED:", result);
      alert(result.message || "Course creation failed");
      return;
    }

    console.log("✅ Course Created:", result);
    alert("Course created successfully!");
  } catch (error) {
    console.error("❌ Error submitting course:", error);
    alert("Something went wrong");
  }
};




// const onSubmit = async (data) => {
//   const formData = new FormData();
//   formData.append("courseName", data.courseTitle);
//   formData.append("courseDescription", data.courseShortDesc);
//   formData.append("price", data.coursePrice);
//   formData.append("whatYouWillLearn", data.courseBenefits);
//   formData.append("category", data.courseCategory);
//   formData.append("status", COURSE_STATUS.DRAFT);
// 
//   // ✅ Correct array handling
//   if (Array.isArray(data.courseTags)) {
//     data.courseTags.forEach((tag) => {
//       formData.append("tag[]", tag);
//     });
//   }
// 
//   if (Array.isArray(data.courseRequirements)) {
//     data.courseRequirements.forEach((req) => {
//       formData.append("instructions[]", req);
//     });
//   }
// 
//   // ✅ Image
//   if (data.courseImage && data.courseImage[0]) {
//     formData.append("thumbnailImage", data.courseImage[0]);
//   }
// 
//   setLoading(true);
// 
//   let result;
//   if (editCourse) {
//     formData.append("courseId", course._id);
//     result = await editCourseDetails(formData, token);
//   } else {
//     result = await addCourseDetails(formData, token);
//   }
// 
//   setLoading(false);
// 
//   if (result) {
//     dispatch(setStep(2));
//     dispatch(setCourse(result));
//   }
// };


  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8 rounded-md border-[1px] border-richblack-700 bg-richblack-800 p-6"
    >
      {/* Course Title */}
      <div className="flex flex-col space-y-2">
        <label className="text-sm text-richblack-5" htmlFor="courseTitle">
          Course Title <sup className="text-pink-200">*</sup>
        </label>
        <input
          id="courseTitle"
          placeholder="Enter Course Title"
          {...register("courseTitle", { required: true })}
          className="form-style w-full"
        />
        {errors.courseTitle && (
          <span className="ml-2 text-xs tracking-wide text-pink-200">
            Course title is required
          </span>
        )}
      </div>
      {/* Course Short Description */}
      <div className="flex flex-col space-y-2">
        <label className="text-sm text-richblack-5" htmlFor="courseShortDesc">
          Course Short Description <sup className="text-pink-200">*</sup>
        </label>
        <textarea
          id="courseShortDesc"
          placeholder="Enter Description"
          {...register("courseShortDesc", { required: true })}
          className="form-style resize-x-none min-h-[130px] w-full"
        />
        {errors.courseShortDesc && (
          <span className="ml-2 text-xs tracking-wide text-pink-200">
            Course Description is required
          </span>
        )}
      </div>
      {/* Course Price */}
      <div className="flex flex-col space-y-2">
        <label className="text-sm text-richblack-5" htmlFor="coursePrice">
          Course Price <sup className="text-pink-200">*</sup>
        </label>
        <div className="relative">
          <input
            id="coursePrice"
            placeholder="Enter Course Price"
            {...register("coursePrice", {
              required: true,
              valueAsNumber: true,
              pattern: {
                value: /^(0|[1-9]\d*)(\.\d+)?$/,
              },
            })}
            className="form-style w-full !pl-12"
          />
          <HiOutlineCurrencyRupee className="absolute left-3 top-1/2 inline-block -translate-y-1/2 text-2xl text-richblack-400" />
        </div>
        {errors.coursePrice && (
          <span className="ml-2 text-xs tracking-wide text-pink-200">
            Course Price is required
          </span>
        )}
      </div>
      {/* Course Category */}

{/* Course Category */}
<div className="flex flex-col space-y-2">
  <label className="text-sm text-richblack-5" htmlFor="courseCategory">
    Course Category <sup className="text-pink-200">*</sup>
  </label>
  <select
  {...register("courseCategory", { required: true })}
  defaultValue=""
  id="courseCategory"
  className="form-style w-full"
>
  <option value="" disabled>
    -- Select a category --
  </option>
  {!loading &&
    courseCategories?.map((category) => (
  <option key={category._id} value={category._id}>
    {category.name}
  </option>
))}


</select>

  {errors.courseCategory && (
    <span className="ml-2 text-xs tracking-wide text-pink-200">
      Course Category is required
    </span>
  )}
</div>





      {/* Course Tags */}
      <ChipInput
        label="Tags"
        name="courseTags"
        placeholder="Enter Tags and press Enter"
        register={register}
        errors={errors}
        setValue={setValue}
        getValues={getValues}
      />



      {/* Course Thumbnail Image */}
    <div className="flex flex-col space-y-2">
  <label className="text-sm text-richblack-5" htmlFor="courseImage">
    Course Thumbnail <sup className="text-pink-200">*</sup>
  </label>

  {editCourse && course?.thumbnail && (
    <img
      src={course.thumbnail}
      alt="Current Thumbnail"
      className="w-40 h-24 rounded-md object-cover"
    />
  )}

  <input
    type="file"
    accept="image/*"
    id="courseImage"
    {...register("courseImage", { required: !editCourse })} 
    className="form-style w-full cursor-pointer"
  />

  {errors.courseImage && (
    <span className="ml-2 text-xs tracking-wide text-pink-200">
      Course thumbnail is required
    </span>
  )}
</div>





      {/* Benefits of the course */}
      <div className="flex flex-col space-y-2">
        <label className="text-sm text-richblack-5" htmlFor="courseBenefits">
          Benefits of the course <sup className="text-pink-200">*</sup>
        </label>
        <textarea
          id="courseBenefits"
          placeholder="Enter benefits of the course"
          {...register("courseBenefits", { required: true })}
          className="form-style resize-x-none min-h-[130px] w-full"
        />
        {errors.courseBenefits && (
          <span className="ml-2 text-xs tracking-wide text-pink-200">
            Benefits of the course is required
          </span>
        )}
      </div>
      {/* Requirements/Instructions */}
      <RequirementsField
        name="courseRequirements"
        label="Requirements/Instructions"
        register={register}
        setValue={setValue}
        errors={errors}
        getValues={getValues}
      />
      {/* Next Button */}
      <div className="flex justify-end gap-x-2">
        {editCourse && (
          <button
            onClick={() => dispatch(setStep(2))}
            disabled={loading}
            className={`flex cursor-pointer items-center gap-x-2 rounded-md bg-richblack-300 py-[8px] px-[20px] font-semibold text-richblack-900`}
          >
            Continue Wihout Saving
          </button>
        )}
        <IconBtn
          disabled={loading}
          text={!editCourse ? "Next" : "Save Changes"}
        >
          <MdNavigateNext />
        </IconBtn>
      </div>
    </form>
  )
}
