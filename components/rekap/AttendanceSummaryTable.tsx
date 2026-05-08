import { CSSProperties } from "react";
import { AttendanceCategoryBadge } from "@/components/rekap/AttendanceCategoryBadge";
import { AttendancePercentageBadge } from "@/components/rekap/AttendancePercentageBadge";
import { RekapKehadiranItem } from "@/lib/types";

export function AttendanceSummaryTable({
  rows,
  visibleCount
}: {
  rows: RekapKehadiranItem[];
  visibleCount: 10 | 20;
}) {
  const listHeight = visibleCount === 10 ? 680 : 1160;
  const listStyle = { maxHeight: listHeight } as CSSProperties;

  return (
    <div className="card">
      <div className="rekap-desktop-list scroll-surface table-wrap" style={listStyle}>
        <table className="table">
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Warga</th>
              <th>Nomor Rumah</th>
              <th>Dawis</th>
              <th>Status Tinggal</th>
              <th>Total Kegiatan</th>
              <th>Total Hadir</th>
              <th>Total Tidak Hadir</th>
              <th>Persentase Kehadiran</th>
              <th>Kategori Kehadiran</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.warga_id}>
                <td>{index + 1}</td>
                <td>
                  <strong>{row.nama}</strong>
                </td>
                <td>{row.nomor_rumah}</td>
                <td>Dawis {row.dawis}</td>
                <td>{row.status_tinggal}</td>
                <td>{row.total_kegiatan}</td>
                <td>{row.total_hadir}</td>
                <td>{row.total_tidak_hadir}</td>
                <td>
                  <AttendancePercentageBadge value={row.persentase_kehadiran} />
                </td>
                <td>
                  <AttendanceCategoryBadge category={row.kategori_kehadiran} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rekap-mobile-list mobile-card-list scroll-surface" style={listStyle}>
        {rows.map((row, index) => (
          <article className="mobile-data-card" key={row.warga_id}>
            <div className="mobile-data-header">
              <div>
                <strong>{index + 1}. {row.nama}</strong>
                <p className="helper-text">Dawis {row.dawis} | Rumah {row.nomor_rumah || "-"}</p>
              </div>
              <AttendanceCategoryBadge category={row.kategori_kehadiran} />
            </div>

            <div className="mobile-data-body">
              <div className="mobile-data-row">
                <span className="mobile-data-label">Status Tinggal</span>
                <span>{row.status_tinggal}</span>
              </div>
              <div className="mobile-data-row">
                <span className="mobile-data-label">Total Kegiatan</span>
                <span>{row.total_kegiatan}</span>
              </div>
              <div className="mobile-data-row">
                <span className="mobile-data-label">Total Hadir</span>
                <span>{row.total_hadir}</span>
              </div>
              <div className="mobile-data-row">
                <span className="mobile-data-label">Tidak Hadir</span>
                <span>{row.total_tidak_hadir}</span>
              </div>
            </div>

            <AttendancePercentageBadge value={row.persentase_kehadiran} />
          </article>
        ))}
      </div>
    </div>
  );
}
