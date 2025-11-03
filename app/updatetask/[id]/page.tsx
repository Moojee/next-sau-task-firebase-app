"use client";

import Image from "next/image";
import task from "./../../../assets/images/task.png";
import Link from "next/link";
import Footer from "@/components/footer";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

// Firebase (สำหรับข้อมูล)
import { firestoreDB } from "@/lib/friebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

// Supabase (สำหรับรูป)
import { supabase } from "@/lib/supabaseClient";

// ประเภท Task ที่เก็บใน Firestore
type TaskDoc = {
  title?: string;
  detail?: string;
  image_url?: string | null;
  is_completed?: boolean;
  create_at?: any;
  update_at?: any;
};

export default function Page() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const taskId = params?.id;

  // ฟอร์ม
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);

  // รูป
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [currentImageUrl, setCurrentImageUrl] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // โหลดข้อมูลจาก Firestore
  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId) return;
      setLoading(true);
      try {
        const taskRef = doc(firestoreDB, "task_cl", taskId);
        const snap = await getDoc(taskRef);

        if (!snap.exists()) {
          alert("ไม่พบข้อมูลงาน");
          router.push("/alltask");
          return;
        }

        const data = snap.data() as TaskDoc;

        setTitle(data.title ?? "");
        setDetail(data.detail ?? "");
        setIsCompleted(!!data.is_completed);

        const url = (data.image_url ?? "").trim();
        setCurrentImageUrl(url);
        setImagePreview(url);
      } catch (err) {
        console.log(err);
        alert("เกิดข้อผิดพลาดในการดึงข้อมูล");
        router.push("/alltask");
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId, router]);

  // เลือกรูปใหม่
  const handleSelectImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // อัปเดตรายการ
  const handleUploadAndUpdate = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!taskId) {
      alert("ไม่พบรหัสงาน");
      return;
    }
    if (title.trim() === "" || detail.trim() === "") {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setSaving(true);

    try {
      let imageUrl = currentImageUrl; // ใช้รูปเดิมก่อน

      // ถ้ามีการเลือกรูปใหม่ ให้ไปอัปโหลดที่ Supabase Storage
      if (imageFile) {
        const newFileName = `${Date.now()}_${imageFile.name}`;

        const { error: uploadErr } = await supabase.storage
          .from("task_bk")
          .upload(newFileName, imageFile);

        if (uploadErr) {
          console.log(uploadErr);
          alert("อัปโหลดรูปไม่สำเร็จ");
          setSaving(false);
          return;
        }

        const { data: pub } = supabase.storage
          .from("task_bk")
          .getPublicUrl(newFileName);

        imageUrl = pub.publicUrl;
      }

      // อัปเดตกลับไปที่ Firestore
      const taskRef = doc(firestoreDB, "task_cl", taskId);
      await updateDoc(taskRef, {
        title: title,
        detail: detail,
        image_url: imageUrl || null,
        is_completed: isCompleted,
        update_at: serverTimestamp(),
      });

      alert("อัปเดตข้อมูลงานเรียบร้อยแล้ว");
      router.push("/alltask");
    } catch (err) {
      console.log(err);
      alert("อัปเดตไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center pb-30">
        {/* ส่วนบน */}
        <Image className="mt-20" src={task} alt="Task" width={120} />

        <h1 className="mt-8 text-2xl font-bold text-blue-700">
          Manage Task App
        </h1>
        <h1 className="mt-2 text-lg text-blue-700">บริการจัดการงานที่ทำ</h1>

        {/* กล่องฟอร์มอัปเดต */}
        <div className="w-3xl border border-gray-500 p-10 mx-auto rounded-xl mt-5 max-w-xl">
          <h1 className="text-xl font-bold text-center">อัปเดตงาน</h1>

          {loading ? (
            <div className="text-center py-6">กำลังโหลด...</div>
          ) : (
            <form onSubmit={handleUploadAndUpdate} className="w-full space-y-4">
              <div>
                <label className="block mb-1">ชื่องาน</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  type="text"
                  className="w-full border rounded-lg p-2"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">รายละเอียด</label>
                <textarea
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  className="w-full border rounded-lg p-2"
                  rows={5}
                  required
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  อัปโหลดรูป (ถ้าไม่เลือกจะใช้รูปเดิม)
                </label>
                <input
                  id="fileInput"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleSelectImage}
                />
                <label
                  htmlFor="fileInput"
                  className="inline-block bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-600"
                >
                  เลือกรูป
                </label>

                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="preview"
                    width={150}
                    height={150}
                    className="mt-2 rounded-lg object-cover"
                  />
                ) : (
                  <div className="mt-2 text-gray-500">ไม่มีรูปภาพ</div>
                )}
              </div>

              <div>
                <label className="block mb-1">สถานะ</label>
                <select
                  value={isCompleted ? "1" : "0"}
                  onChange={(e) => setIsCompleted(e.target.value === "1")}
                  className="w-full border rounded-lg p-2"
                >
                  <option value="0">ยังไม่เสร็จ</option>
                  <option value="1">เสร็จแล้ว</option>
                </select>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-60"
                >
                  {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
                </button>
              </div>
            </form>
          )}

          <Link
            href="/alltask"
            className="text-blue-500 w-full text-center mt-5 block hover:text-blue-600"
          >
            กลับไปหน้าแสดงงานทั้งหมด
          </Link>
        </div>

        <Footer />
      </div>
    </>
  );
}
