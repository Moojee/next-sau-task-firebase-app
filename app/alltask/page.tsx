"use client";

import Image from "next/image";
import task from "./../../assets/images/task.png";
import Link from "next/link";
import Footer from "@/components/footer";
import { useEffect, useState } from "react";
import { firestoreDB } from "@/lib/friebaseConfig";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";

// สร้างประเภทข้อมูล Task
type Task = {
  id: string;
  create_at: Date | null;
  title: string;
  detail: string;
  image_url: string | null;
  is_completed: boolean;
  update_at: Date | null;
};

export default function Page() {
  // สร้างตัวแปร state สำหรับเก็บรายการงานทั้งหมด
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    // ดึงข้อมูลรายการงานทั้งหมดจาก Firebase
    const fetchTasks = async () => {
      try {
        // 1) อ่าน collection task_cl
        const snapshot = await getDocs(collection(firestoreDB, "task_cl"));

        // 2) แปลงข้อมูลจาก snapshot ให้เป็น array ของ Task
        const list: Task[] = snapshot.docs.map((d) => {
          const data = d.data();

          return {
            id: d.id,
            title: data.title ?? "",
            detail: data.detail ?? "",
            image_url: data.image_url ?? null,
            is_completed: data.is_completed ?? false,
            // Firestore Timestamp ต้อง .toDate()
            create_at: data.create_at ? data.create_at.toDate() : null,
            update_at: data.update_at ? data.update_at.toDate() : null,
          };
        });

        // 3) เก็บลง state
        setTasks(list);
      } catch (err) {
        console.log("error get tasks:", err);
        alert("เกิดข้อผิดพลาดในการดึงข้อมูล");
      }
    };

    fetchTasks();
  }, []);

  // สร้าง function เพื่อควบคุมการทำงานของการคลิกปุ่มลบ เพื่อลบข้อมูลออกจาก Firebase
  const handleDeleteClick = async (id: string) => {
    const ok = confirm("ต้องการลบงานนี้ใช่หรือไม่?");
    if (!ok) return;

    try {
      // 1) ลบใน Firestore
      await deleteDoc(doc(firestoreDB, "task_cl", id));

      // 2) ลบใน state เพื่อให้ UI อัปเดตทันที
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.log("delete error:", err);
      alert("ลบไม่สำเร็จ");
    }
  };

  return (
    <>
      <div className="flex flex-col items-center">
        <Image className="mt-20" src={task} alt="Task" width={120} />

        <h1 className="mt-5 text-2xl font-bold text-gray-600">
          Manage Task App
        </h1>

        <h1 className="text-l text-gray-500">บริหารจัดการงานที่ทำ</h1>

        {/* ส่วนปุ่มเพิ่มงาน */}
        <div className="w-10/12 flex justify-end">
          <Link
            href="/addtask"
            className="bg-gray-500 hover:bg-gray-700 px-10 py-2 rounded-2xl mt-10 text-white"
          >
            เพิ่มงาน
          </Link>
        </div>

        {/* ส่วนแสดงตาราง */}
        <div className="w-10/12 flex mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="text-center border font-bold bg-gray-400">
                <th className="border p-2">รูป</th>
                <th className="border p-2">งานที่ต้องทำ</th>
                <th className="border p-2">รายละเอียดงาน</th>
                <th className="border p-2">สถานะ</th>
                <th className="border p-2">วันที่เพิ่ม</th>
                <th className="border p-2">วันที่แก้ไข</th>
                <th className="border p-2">action</th>
              </tr>
            </thead>

            <tbody>
              {/* วนลูปเอาข้อมูลที่อยู่ใน state: tasks มาแสดงในตารางทีละแถว */}
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td className="border p-2 text-center">
                    {task.image_url ? (
                      <Image
                        className="mx-auto"
                        src={task.image_url}
                        alt={task.title}
                        width={50}
                        height={50}
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="border p-2">{task.title}</td>
                  <td className="border p-2">{task.detail}</td>
                  <td className="border p-2 text-center">
                    {task.is_completed ? "✔︎ สำเร็จ" : "✕ ไม่สำเร็จ"}
                  </td>
                  <td className="border p-2 text-center">
                    {task.create_at ? task.create_at.toLocaleString() : "-"}
                  </td>
                  <td className="border p-2 text-center">
                    {task.update_at ? task.update_at.toLocaleString() : "-"}
                  </td>
                  <td className="border p-2 text-center">
                    <Link
                      className="text-green-500 mr-5 hover:text-green-700"
                      href={`/updatetask/${task.id}`}
                    >
                      แก้ไข
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(task.id)}
                      className="text-red-500 hover:text-red-700 cursor-pointer"
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}

              {tasks.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-5 text-gray-500 bg-gray-50"
                  >
                    ยังไม่มีงานที่บันทึกไว้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Footer />
    </>
  );
}
