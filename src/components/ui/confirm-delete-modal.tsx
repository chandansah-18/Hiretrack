"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { ModalShell } from "./modal-shell";

export interface ConfirmDeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType?: string;
  title?: string;
  /** When true, user must type the item name to enable Delete */
  requireTypedConfirm?: boolean;
}

export function ConfirmDeleteModal({
  open,
  onClose,
  onConfirm,
  itemName,
  itemType = "item",
  title,
  requireTypedConfirm = true,
}: ConfirmDeleteModalProps) {
  const [typed, setTyped] = useState("");
  const canDelete = !requireTypedConfirm || typed.trim() === itemName.trim();

  function handleClose() {
    setTyped("");
    onClose();
  }

  function handleConfirm() {
    if (!canDelete) return;
    setTyped("");
    onConfirm();
  }

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      title={title ?? `Delete ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`}
      accent="rose"
      size="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button size="sm" variant="destructive" onClick={handleConfirm} disabled={!canDelete}>
            Delete
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-3 text-center py-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <Trash2 className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <p className="text-sm text-slate-600">
            Are you sure you want to delete <strong className="text-slate-900">{itemName}</strong>?
          </p>
          <p className="mt-1 text-xs text-slate-400">
            This removes it from the active dashboard. Soft-archived records can still be purged later by an admin.
          </p>
        </div>
        {requireTypedConfirm && (
          <div className="w-full text-left space-y-1.5 pt-1">
            <label className="text-[11px] font-medium text-slate-500">
              Type <span className="font-semibold text-slate-800">{itemName}</span> to confirm
            </label>
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={itemName}
              autoFocus
            />
          </div>
        )}
      </div>
    </ModalShell>
  );
}
