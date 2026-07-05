"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button, Input, Card } from "@/components/ui";

export default function TrackPage() {
  const router = useRouter();
  const [trackingNumber, setTrackingNumber] = useState("");

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-8 text-center text-3xl font-bold text-gray-900">Track Your Shipment</h1>
      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (trackingNumber.trim()) {
              router.push(`/track/${trackingNumber.trim().toUpperCase()}`);
            }
          }}
          className="flex gap-3"
        >
          <Input
            type="text"
            placeholder="Enter tracking number (e.g. TRL-0001-0001)"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            className="h-12 text-base"
          />
          <Button type="submit" className="h-12 px-6">
            <Search className="mr-2 h-5 w-5" />
            Track
          </Button>
        </form>
      </Card>
    </div>
  );
}
