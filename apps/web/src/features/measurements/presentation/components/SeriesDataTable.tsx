import { displayReadingText, formatDay } from '../../application/formatMeasurement';
import type { SeriesPoint } from '../../application/ports';

// Bảng số liệu ẩn đi kèm biểu đồ cho trình đọc màn hình (Design §2.2, §8.2); caption là câu mô tả trung lập.
// sr-only đặt ở div bọc: <table> bỏ qua width 1px nên tự nó vẫn tràn ngang trên di động.
export function SeriesDataTable({ caption, points }: { caption: string; points: SeriesPoint[] }) {
  return (
    <div className="sr-only">
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Ngày đo</th>
            <th scope="col">Giá trị</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.id}>
              <th scope="row">
                {formatDay(point.measuredOn)}
                {point.measuredTime ? ` ${point.measuredTime}` : ''}
              </th>
              <td>{displayReadingText(point)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
