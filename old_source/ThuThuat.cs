using Microsoft.Office.Interop.Excel;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Data.OleDb;
using System.Diagnostics.Metrics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static Auto_ThuThuat.BNManage;

namespace Auto_ThuThuat
{
	internal class ThuThuat
	{
		public class TT
		{
			public string STT { get; set; }
			public string Code { get; set; }
			public string Name { get; set; }
			public string TimeKham { get; set; }
			public string RaVien { get; set; }

			public string Cham { get; set; }
			public string MangCham { get; set; }
			public string Xung { get; set; }
			public string HongNgoai { get; set; }
			public string RongRoc { get; set; }
			public string Parafin { get; set; }
			public string Cay { get; set; }
			public string Ngam { get; set; }
			public string Xong { get; set; }
			public string Bo { get; set; }
			public string XoaMay { get; set; }
			public string XoaTay { get; set; }
			public string Cuu { get; set; }
			public string GiacHoi { get; set; }

			public object ttCham { get; set; }
			public object ttMangCham { get; set; }
			public object ttXung { get; set; }
			public object ttHongNgoai { get; set; }
			public object ttRongRoc { get; set; }
			public object ttParafin { get; set; }
			public object ttCay { get; set; }
			public object ttNgam { get; set; }
			public object ttXong { get; set; }
			public object ttBo { get; set; }
			public object ttXoaMay { get; set; }
			public object ttXoaTay { get; set; }
			public object ttCuu { get; set; }
			public object ttGiacHoi { get; set; }
		}

		public class BS
		{
			public string STT { get; set; }
			public string Code { get; set; }
			public string Name { get; set; }
			public string Role { get; set; }
			public string LeaveSang { get; set; }
			public string LeaveChieu { get; set; }
			public string StartTimeMorning { get; set; }
			public string EndTimeMorning { get; set; }
			public string StartTimeAfternoon { get; set; }
			public string EndTimeAfternoon { get; set; }
			public string ThuThuat { get; set; }
		}

		public class CD
		{
			public string MorningStart { get; set; }
			public string MorningEnd { get; set; }
			public string AfternoonStart { get; set; }
			public string AfternoonEnd { get; set; }
			public string SLNgam { get; set; }
			public string SLXong { get; set; }
			public string SLXung { get; set; }
			public string SLBo { get; set; }
			public string TimeNext { get; set; }
		}

		public class ExcelChiaTTDataService
		{
			OleDbConnection Conn;
			OleDbCommand Cmd;

			public ExcelChiaTTDataService()
			{
				string ExcelFilePath = AppDomain.CurrentDomain.BaseDirectory + "Data_ChiaThuThuat.xlsx";
				string excelConnectionString = @"Provider=Microsoft.ACE.OLEDB.12.0;Data Source=" + ExcelFilePath + ";Extended Properties=Excel 12.0;Persist Security Info=True";
				Conn = new OleDbConnection(excelConnectionString);
			}

			public async Task<ObservableCollection<TT>> ReadRecordTT()
			{
				ObservableCollection<TT> TTs = new ObservableCollection<TT>();
				await Conn.OpenAsync();
				Cmd = new OleDbCommand();
				Cmd.Connection = Conn;
				Cmd.CommandText = "Select * from [BN$]";
				var Reader = await Cmd.ExecuteReaderAsync();
				while (Reader.Read())
				{
					TTs.Add(new TT()
					{
						STT = Reader["STT"].ToString(),
						Code = Reader["Giường"].ToString(),
						Name = Reader["Tên bệnh nhân"].ToString(),
						TimeKham = Reader["Giờ khám"].ToString(),
						RaVien = Reader["Ra viện"].ToString(),

						Cham = Reader["Cham"].ToString(),
						MangCham = Reader["MangCham"].ToString(),
						Xung = Reader["Xung"].ToString(),
						HongNgoai = Reader["HongNgoai"].ToString(),
						RongRoc = Reader["RongRoc"].ToString(),
						Parafin = Reader["Parafin"].ToString(),
						Cay = Reader["Cay"].ToString(),
						Ngam = Reader["Ngam"].ToString(),
						Xong = Reader["Xong"].ToString(),
						Bo = Reader["Bo"].ToString(),
						XoaMay = Reader["XoaMay"].ToString(),
						XoaTay = Reader["XoaTay"].ToString(),
						Cuu = Reader["Cuu"].ToString(),
						GiacHoi = Reader["GiacHoi"].ToString(),

						ttCham = Reader["Time Châm"].ToString(),
						ttMangCham = Reader["Time Mãng Châm"].ToString(),
						ttXung = Reader["Time Xung"].ToString(),
						ttHongNgoai = Reader["Time Hồng Ngoại"].ToString(),
						ttRongRoc = Reader["Time Ròng Rọc"].ToString(),
						ttParafin = Reader["Time Parafin"].ToString(),
						ttCay = Reader["Time Cấy"].ToString(),
						ttNgam = Reader["Time Ngâm"].ToString(),
						ttXong = Reader["Time Xông"].ToString(),
						ttBo = Reader["Time Bó"].ToString(),
						ttXoaMay = Reader["Time Xoa máy"].ToString(),
						ttXoaTay = Reader["Time Xoa tay"].ToString(),
						ttCuu = Reader["Time Cứu"].ToString(),
						ttGiacHoi = Reader["Time Giác Hơi"].ToString(),
					});
				}
				Reader.Close();
				Conn.Close();
				return TTs;
			}

			public async Task<ObservableCollection<BS>> ReadRecordBS()
			{
				ObservableCollection<BS> BSs = new ObservableCollection<BS>();
				await Conn.OpenAsync();
				Cmd = new OleDbCommand();
				Cmd.Connection = Conn;
				Cmd.CommandText = "Select * from [BS$]";
				var Reader = await Cmd.ExecuteReaderAsync();
				while (Reader.Read())
				{
					BSs.Add(new BS()
					{
						STT = Reader["STT"].ToString(),
						Code = Reader["Mã KTV"].ToString(),
						Name = Reader["Tên KTV"].ToString(),
						Role= Reader["Chức danh"].ToString(),
						LeaveSang = Reader["Nghỉ buổi sáng"].ToString(),
						LeaveChieu = Reader["Nghỉ buổi chiều"].ToString(),
						StartTimeMorning = Reader["Giờ bắt đầu buổi sáng"].ToString(),
						EndTimeMorning = Reader["Giờ kết thúc buổi sáng"].ToString(),
						StartTimeAfternoon = Reader["Giờ bắt đầu buổi chiều"].ToString(),
						EndTimeAfternoon = Reader["Giờ kết thúc buổi chiều"].ToString(),
						ThuThuat = Reader["Thủ thuật"].ToString(),
					});
				}
				Reader.Close();
				Conn.Close();
				return BSs;
			}

			public async Task<ObservableCollection<CD>> ReadRecordCD()
			{
				ObservableCollection<CD> CDs = new ObservableCollection<CD>();
				await Conn.OpenAsync();
				Cmd = new OleDbCommand();
				Cmd.Connection = Conn;
				Cmd.CommandText = "Select * from [Setting$]";
				var Reader = await Cmd.ExecuteReaderAsync();
				while (Reader.Read())
				{
					CDs.Add(new CD()
					{
						MorningStart = Reader["Giờ BĐ sáng"].ToString(),
						MorningEnd = Reader["Giờ KT sáng"].ToString(),
						AfternoonStart = Reader["Giờ BĐ chiều"].ToString(),
						AfternoonEnd = Reader["Giờ KT chiều"].ToString(),
						SLNgam = Reader["SL chậu ngâm"].ToString(),
						SLXong = Reader["SL chậu xông"].ToString(),
						SLXung = Reader["SL máy xung"].ToString(),
						SLBo = Reader["SL máy bó"].ToString(),
						TimeNext = Reader["Khoảng thời gian cách nhau TT"].ToString(),
					});
				}
				Reader.Close();
				Conn.Close();
				return CDs;
			}

			public async Task<bool> ManageExcelTT(TT tt)
			{
				bool IsSave = false;
				if (tt.STT != "" && tt.STT != null)
				{
					await Conn.OpenAsync();
					Cmd = new OleDbCommand();
					Cmd.Connection = Conn;

					Cmd.Parameters.AddWithValue("@Cham", tt.Cham);
					Cmd.Parameters.AddWithValue("@MangCham", tt.MangCham);
					Cmd.Parameters.AddWithValue("@Xung", tt.Xung);
					Cmd.Parameters.AddWithValue("@HongNgoai", tt.HongNgoai);
					Cmd.Parameters.AddWithValue("@RongRoc", tt.RongRoc);
					Cmd.Parameters.AddWithValue("@Parafin", tt.Parafin);
					Cmd.Parameters.AddWithValue("@Cay", tt.Cay);
					Cmd.Parameters.AddWithValue("@Ngam", tt.Ngam);
					Cmd.Parameters.AddWithValue("@Xong", tt.Xong);
					Cmd.Parameters.AddWithValue("@Bo", tt.Bo);
					Cmd.Parameters.AddWithValue("@XoaMay", tt.XoaMay);
					Cmd.Parameters.AddWithValue("@XoaTay", tt.XoaTay);
					Cmd.Parameters.AddWithValue("@Cuu", tt.Cuu);
					Cmd.Parameters.AddWithValue("@GiacHoi", tt.GiacHoi);

					Cmd.Parameters.AddWithValue("@STT", tt.STT);

					Cmd.CommandText = "Update [BN$] set " +
						"Cham = @Cham, " +
						"MangCham = @MangCham, " +
						"Xung = @Xung, " +
						"HongNgoai = @HongNgoai, " +
						"RongRoc = @RongRoc, " +
						"Parafin = @Parafin, " +
						"Cay = @Cay, " +
						"Ngam = @Ngam, " +
						"Xong = @Xong, " +
						"Bo = @Bo, " +
						"XoaMay = @XoaMay, " +
						"XoaTay = @XoaTay, " +
						"Cuu = @Cuu, " +
						"GiacHoi = @GiacHoi " +
						"where STT = @STT";

					int result = await Cmd.ExecuteNonQueryAsync();
					if (result > 0)
					{
						IsSave = true;
					}
					Conn.Close();
				}
				return IsSave;

			}

			public async Task<bool> ManageExcelPrintTT(string STT, List<string> dataLst, List<string> nameLst)
			{
				bool IsSave = false;
				if (STT != "" && STT != null)
				{
					await Conn.OpenAsync();
					Cmd = new OleDbCommand();
					Cmd.Connection = Conn;

					for (int i = 0; i < dataLst.Count; i++)
					{
						Cmd.Parameters.AddWithValue("@value" + i, dataLst[i]);
					}
					Cmd.Parameters.AddWithValue("@STT", STT);

					string sql = "Update [TT$] set ";

					for (int i = 0; i < dataLst.Count; i++)
					{
						sql += nameLst[i] + " = @value" + i + " ,";
					}

					sql = sql.Remove(sql.Length - 1, 1) + " where STT = @STT";

					Cmd.CommandText = sql;

					int result = await Cmd.ExecuteNonQueryAsync();
					if (result > 0)
					{
						IsSave = true;
					}
					Conn.Close();
				}
				return IsSave;

			}
		}
	}
}
