import { AttendanceCategoryBadge } from "@/components/rekap/AttendanceCategoryBadge";
import { AttendancePercentageBadge } from "@/components/rekap/AttendancePercentageBadge";
import { RekapKehadiranItem } from "@/lib/types";

export function AttendanceSummaryTable({ rows }: { rows: RekapKehadiranItem[] }) {
  return (
    <div className="card table-wrap">
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
  );
}

