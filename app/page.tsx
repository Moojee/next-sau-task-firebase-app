import Image from "next/image";
import task from "./../assets/images/task.png";
import Link from "next/link";
import Footer from "@/components/footer";

export default function Page() {
  return (
    <>
      <div className="flex flex-col items-center ">
        <Image className="mt-20" src={task} alt="Task" width={200} />

        <h1 className="mt-10 text-4xl font-bold text-gray-600">
          Manage Task App By Firebase
        </h1>

        <h1 className="text-2xl text-gray-500">บริหารจัดการงานที่ทำ</h1>

        <Link
          href="/alltask"
          className=" bg-gray-500 hover:bg-gray-700 px-10 py-3 rounded-3xl mt-10 text-white "
        >
          เข้าใช้งานแอปพลิเคชัน
        </Link>
        <Footer />
      </div>
    </>
  );
}
