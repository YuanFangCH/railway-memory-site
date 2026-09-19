"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchForm({ initialValue = "" }: { initialValue?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const q = value.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-xl gap-2">
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="搜索文章、视频和图片"
        aria-label="搜索"
        className="h-10"
      />
      <Button type="submit" className="shrink-0">
        <Search className="size-4" />
        搜索
      </Button>
    </form>
  );
}
