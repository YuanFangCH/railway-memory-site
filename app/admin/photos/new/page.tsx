import { ImageForm } from "@/components/admin/image-form";

export default function NewPhotoPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-normal">新建图片</h1>
      <ImageForm />
    </div>
  );
}
