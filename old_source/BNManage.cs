using Microsoft.Office.Interop.Excel;
using OpenQA.Selenium;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Data;
using System.Data.Common;
using System.Data.OleDb;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Auto_ThuThuat
{
	internal class BNManage
	{
		public class BN
		{
			public string STT { get; set; }
			public string CodeBA { get; set; }
			public string Name { get; set; }
			public string DateTT { get; set; }
			public string TimeCham { get; set; }
			public string TimeParafin { get; set; }
			public string TimeDienXung { get; set; }
			public string TimeHN { get; set; }
			public string TimeTap { get; set; }
			public string TimeGH { get; set; }
			public string DateChamDT { get; set; }
			public string DateParafinDT { get; set; }
			public string DateDienXungDT { get; set; }
			public string DateTapDT { get; set; }
			public string KTVCham { get; set; }
			public string BSCham { get; set; }
			public string MoTaCham { get; set; }
			public string KTVParafin { get; set; }
			public string BSParafin { get; set; }
			public string MoTaParafin { get; set; }
			public string KTVDienXung { get; set; }
			public string BSDienXung { get; set; }
			public string MoTaDienXung { get; set; }
			public string KTVTap { get; set; }
			public string BSTap { get; set; }
			public string MoTaTap { get; set; }
			public string KTVGH { get; set; }
			public string MoTaGH { get; set; }

			public string KQAll { get; set; }
			public string KQChamPTTT { get; set; }
			public string KQChamVT { get; set; }
			public string KQChamVTPT { get; set; }
			public string KQParafinPTTT { get; set; }
			public string KQParafinVT { get; set; }
			public string KQDienXungPTTT { get; set; }
			public string KQDienXungVT { get; set; }
			public string KQTapPTTT { get; set; }
			public string KQTapVT { get; set; }
			public string KQGHPTTT { get; set; }
			public string KQGHVT { get; set; }
		}

		public class CP
		{
			public string STT { get; set; }
			public string CodeBA { get; set; }
			public string Name { get; set; }
			public string TimeDT { get; set; }
			public string DateDTCopy { get; set; }
			public string DateDTStart { get; set; }
			public string DateDTEnd { get; set; }
			public string DatePTCopy { get; set; }
			public string DatePTStart { get; set; }
			public string DatePTEnd { get; set; }
			public string KQDTCOPY { get; set; }
			public string KQDTSEND { get; set; }
			public string KQPTCOPY { get; set; }
			public string KQPTSEND { get; set; }
		}

		public class Setting
		{
			public string Site { get; set; }
			public string User { get; set; }
			public string Name { get; set; }
			public string Pass { get; set; }
			public string Khoa { get; set; }
			public string Phong { get; set; }
			public string Kho { get; set; }
		}

		public class ExcelDataService
		{
			OleDbConnection Conn;
			OleDbCommand Cmd;

			public ExcelDataService()
			{
				string ExcelFilePath = AppDomain.CurrentDomain.BaseDirectory + "Data_ThuThuat.xlsx";
				string excelConnectionString = @"Provider=Microsoft.ACE.OLEDB.12.0;Data Source=" + ExcelFilePath + ";Extended Properties=Excel 12.0;Persist Security Info=True";
				Conn = new OleDbConnection(excelConnectionString);
			}

			/// <summary>  
			/// Method to Get All the Records from Excel  
			/// </summary>  
			/// <returns></returns>  
			public async Task<ObservableCollection<BN>> ReadRecordFromEXCELAsync()
			{
				ObservableCollection<BN> BNs = new ObservableCollection<BN>();
				await Conn.OpenAsync();
				Cmd = new OleDbCommand();
				Cmd.Connection = Conn;
				Cmd.CommandText = "Select * from [Data$]";
				var Reader = await Cmd.ExecuteReaderAsync();
				while (Reader.Read())
				{
					BNs.Add(new BN()
					{
						STT = Reader["STT"].ToString(),
						CodeBA = Reader["CodeBA"].ToString(),
						Name = Reader["Name"].ToString(),
						DateTT = Reader["DateTT"].ToString(),
						TimeCham = Reader["TimeCham"].ToString(),
						TimeParafin = Reader["TimeParafin"].ToString(),
						TimeDienXung = Reader["TimeDienXung"].ToString(),
						TimeHN = Reader["TimeHN"].ToString(),
						TimeTap = Reader["TimeTap"].ToString(),
						TimeGH = Reader["TimeGH"].ToString(),
						DateChamDT = Reader["DateChamDT"].ToString(),
						DateParafinDT = Reader["DateParafinDT"].ToString(),
						DateDienXungDT = Reader["DateDienXungDT"].ToString(),
						DateTapDT = Reader["DateTapDT"].ToString(),
						KTVCham = Reader["KTVCham"].ToString(),
						BSCham = Reader["BSCham"].ToString(),
						MoTaCham = Reader["MoTaCham"].ToString(),
						KTVParafin = Reader["KTVParafin"].ToString(),
						BSParafin = Reader["BSParafin"].ToString(),
						MoTaParafin = Reader["MoTaParafin"].ToString(),
						KTVDienXung = Reader["KTVDienXung"].ToString(),
						BSDienXung = Reader["BSDienXung"].ToString(),
						MoTaDienXung = Reader["MoTaDienXung"].ToString(),
						KTVTap = Reader["KTVTap"].ToString(),
						BSTap = Reader["BSTap"].ToString(),
						MoTaTap = Reader["MoTaTap"].ToString(),
						KTVGH = Reader["KTVGH"].ToString(),
						MoTaGH = Reader["MoTaGH"].ToString(),

						KQAll = Reader["KQAll"].ToString(),
						KQChamPTTT = Reader["KQChamPTTT"].ToString(),
						KQChamVT = Reader["KQChamVT"].ToString(),
						KQChamVTPT = Reader["KQChamVTPT"].ToString(),
						KQParafinPTTT = Reader["KQParafinPTTT"].ToString(),
						KQParafinVT = Reader["KQParafinVT"].ToString(),
						KQDienXungPTTT = Reader["KQDienXungPTTT"].ToString(),
						KQDienXungVT = Reader["KQDienXungVT"].ToString(),
						KQTapPTTT = Reader["KQTapPTTT"].ToString(),
						KQTapVT = Reader["KQTapVT"].ToString(),
						KQGHPTTT = Reader["KQGHPTTT"].ToString(),
						KQGHVT = Reader["KQGHVT"].ToString(),
					});
				}
				Reader.Close();
				Conn.Close();
				return BNs;
			}

			public async Task<ObservableCollection<Setting>> ReadSettingFromEXCELAsync()
			{
				ObservableCollection<Setting> STs = new ObservableCollection<Setting>();
				await Conn.OpenAsync();
				Cmd = new OleDbCommand();
				Cmd.Connection = Conn;
				Cmd.CommandText = "Select * from [Setting$]";
				var Reader = await Cmd.ExecuteReaderAsync();
				while (Reader.Read())
				{
					STs.Add(new Setting()
					{
						Site = Reader["Site"].ToString(),
						User = Reader["User"].ToString(),
						Name = Reader["Name"].ToString(),
						Pass = Reader["Pass"].ToString(),
						Khoa = Reader["Khoa"].ToString(),
						Phong = Reader["Phòng"].ToString(),
						Kho = Reader["Kho vật tư"].ToString()
					});
					break;
				}
				Reader.Close();
				Conn.Close();
				return STs;
			}

			public async Task<ObservableCollection<CP>> ReadDataDTFromEXCELAsync()
			{
				ObservableCollection<CP> CPs = new ObservableCollection<CP>();
				await Conn.OpenAsync();
				Cmd = new OleDbCommand();
				Cmd.Connection = Conn;
				Cmd.CommandText = "Select * from [Data_DT$]";
				var Reader = await Cmd.ExecuteReaderAsync();
				while (Reader.Read())
				{
					CPs.Add(new CP()
					{
						STT = Reader["STT"].ToString(),
						CodeBA = Reader["Mã BA"].ToString(),
						Name = Reader["Họ tên BN"].ToString(),
						TimeDT = Reader["Giờ ĐT"].ToString(),
						DateDTCopy = Reader["Ngày ĐT Copy"].ToString(),
						DateDTStart = Reader["Ngày ĐT Start"].ToString(),
						DateDTEnd = Reader["Ngày ĐT End"].ToString(),
						//DatePTCopy = Reader["Ngày PT Copy"].ToString(),
						//DatePTStart = Reader["Ngày PT Start"].ToString(),
						//DatePTEnd = Reader["Ngày PT End"].ToString(),
						KQDTCOPY = Reader["KQDTCOPY"].ToString(),
						KQDTSEND = Reader["KQDTSEND"].ToString(),
						KQPTCOPY = Reader["KQPTTTCOPY"].ToString(),
						//KQPTSEND = Reader["KQPTSEND"].ToString()
					});
				}
				Reader.Close();
				Conn.Close();
				return CPs;
			}

			/// <summary>  
			/// Method to Insert Record in the Excel  
			/// S1. If the EmpNo =0, then the Operation is Skipped.  
			/// S2. If the Student is already exist, then it is taken for Update  
			/// </summary>  
			/// <param name="Emp"></param>  
			public async Task<bool> ManageExcelRecordsAsync(BN stud)
			{
				bool IsSave = false;
				if (stud.STT != "" && stud.STT != null)
				{
					await Conn.OpenAsync();
					Cmd = new OleDbCommand();
					Cmd.Connection = Conn;

					Cmd.Parameters.AddWithValue("@KQAll", stud.KQAll);
					Cmd.Parameters.AddWithValue("@KQChamPTTT", stud.KQChamPTTT);
					Cmd.Parameters.AddWithValue("@KQChamVT", stud.KQChamVT);
					Cmd.Parameters.AddWithValue("@KQChamVTPT", stud.KQChamVTPT);
					Cmd.Parameters.AddWithValue("@KQParafinPTTT", stud.KQParafinPTTT);
					Cmd.Parameters.AddWithValue("@KQParafinVT", stud.KQParafinVT);
					Cmd.Parameters.AddWithValue("@KQDienXungPTTT", stud.KQDienXungPTTT);
					Cmd.Parameters.AddWithValue("@KQDienXungVT", stud.KQDienXungVT);
					Cmd.Parameters.AddWithValue("@KQTapPTTT", stud.KQTapPTTT);
					Cmd.Parameters.AddWithValue("@KQTapVT", stud.KQTapVT);
					Cmd.Parameters.AddWithValue("@KQGHPTTT", stud.KQGHPTTT);
					Cmd.Parameters.AddWithValue("@KQGHVT", stud.KQGHVT);
					Cmd.Parameters.AddWithValue("@STT", stud.STT);

					Cmd.CommandText = "Update [Data$] set KQAll = @KQAll, " +
						"KQChamPTTT = @KQChamPTTT, " +
						"KQChamVT = @KQChamVT, " +
						"KQChamVTPT = @KQChamVTPT, " +
						"KQParafinPTTT = @KQParafinPTTT, " +
						"KQParafinVT = @KQParafinVT, " +
						"KQDienXungPTTT = @KQDienXungPTTT, " +
						"KQDienXungVT=@KQDienXungVT, " +
						"KQTapPTTT = @KQTapPTTT, " +
						"KQTapVT=@KQTapVT, " +
						"KQGHPTTT=@KQGHPTTT, " +
						"KQGHVT=@KQGHVT " +
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

			public async Task<bool> ManageUpdateRecordsAsync(BN stud)
			{
				bool IsSave = false;
				if (stud.STT != "" && stud.STT != null)
				{
					await Conn.OpenAsync();
					Cmd = new OleDbCommand();
					Cmd.Connection = Conn;

					Cmd.Parameters.AddWithValue("@CodeBA", stud.CodeBA);
					Cmd.Parameters.AddWithValue("@Name", stud.Name);
					Cmd.Parameters.AddWithValue("@DateTT", stud.DateTT);
					Cmd.Parameters.AddWithValue("@TimeCham", stud.TimeCham);
					Cmd.Parameters.AddWithValue("@TimeParafin", stud.TimeParafin);
					Cmd.Parameters.AddWithValue("@TimeDienXung", stud.TimeDienXung);
					Cmd.Parameters.AddWithValue("@TimeHN", stud.TimeHN);
					Cmd.Parameters.AddWithValue("@TimeTap", stud.TimeTap);
					Cmd.Parameters.AddWithValue("@TimeGH", stud.TimeGH);
					Cmd.Parameters.AddWithValue("@DateChamDT", stud.DateChamDT);
					Cmd.Parameters.AddWithValue("@DateParafinDT", stud.DateParafinDT);
					Cmd.Parameters.AddWithValue("@DateDienXungDT", stud.DateDienXungDT);
					Cmd.Parameters.AddWithValue("@DateTapDT", stud.DateTapDT);
					Cmd.Parameters.AddWithValue("@KTVCham", stud.KTVCham);
					Cmd.Parameters.AddWithValue("@BSCham", stud.BSCham);
					Cmd.Parameters.AddWithValue("@MoTaCham", stud.MoTaCham);
					Cmd.Parameters.AddWithValue("@KTVParafin", stud.KTVParafin);
					Cmd.Parameters.AddWithValue("@BSParafin", stud.BSParafin);
					Cmd.Parameters.AddWithValue("@MoTaParafin", stud.MoTaParafin);
					Cmd.Parameters.AddWithValue("@KTVDienXung", stud.KTVDienXung);
					Cmd.Parameters.AddWithValue("@BSDienXung", stud.BSDienXung);
					Cmd.Parameters.AddWithValue("@MoTaDienXung", stud.MoTaDienXung);
					Cmd.Parameters.AddWithValue("@KTVTap", stud.KTVTap);
					Cmd.Parameters.AddWithValue("@BSTap", stud.BSTap);
					Cmd.Parameters.AddWithValue("@MoTaTap", stud.MoTaTap);
					Cmd.Parameters.AddWithValue("@KTVGH", stud.KTVGH);
					Cmd.Parameters.AddWithValue("@MoTaGH", stud.MoTaGH);

					Cmd.Parameters.AddWithValue("@KQAll", stud.KQAll);
					Cmd.Parameters.AddWithValue("@KQChamPTTT", stud.KQChamPTTT);
					Cmd.Parameters.AddWithValue("@KQChamVT", stud.KQChamVT);
					Cmd.Parameters.AddWithValue("@KQChamVTPT", stud.KQChamVTPT);
					Cmd.Parameters.AddWithValue("@KQParafinPTTT", stud.KQParafinPTTT);
					Cmd.Parameters.AddWithValue("@KQParafinVT", stud.KQParafinVT);
					Cmd.Parameters.AddWithValue("@KQDienXungPTTT", stud.KQDienXungPTTT);
					Cmd.Parameters.AddWithValue("@KQDienXungVT", stud.KQDienXungVT);
					Cmd.Parameters.AddWithValue("@KQTapPTTT", stud.KQTapPTTT);
					Cmd.Parameters.AddWithValue("@KQTapVT", stud.KQTapVT);
					Cmd.Parameters.AddWithValue("@KQGHPTTT", stud.KQGHPTTT);
					Cmd.Parameters.AddWithValue("@KQGHVT", stud.KQGHVT);
					Cmd.Parameters.AddWithValue("@STT", stud.STT);

					Cmd.CommandText = "Update [Data$] set " +

						"CodeBA = @CodeBA, " +
						"Name = @Name, " +
						"DateTT = @DateTT, " +
						"TimeCham = @TimeCham, " +
						"TimeParafin = @TimeParafin, " +
						"TimeDienXung = @TimeDienXung, " +
						"TimeHN = @TimeHN, " +
						"TimeTap = @TimeTap, " +
						"TimeGH = @TimeGH, " +
						"DateChamDT = @DateChamDT, " +
						"DateParafinDT = @DateParafinDT, " +
						"DateDienXungDT = @DateDienXungDT, " +
						"DateTapDT = @DateTapDT, " +
						"KTVCham = @KTVCham, " +
						"BSCham = @BSCham, " +
						"MoTaCham = @MoTaCham, " +
						"KTVParafin = @KTVParafin, " +
						"BSParafin = @BSParafin, " +
						"MoTaParafin = @MoTaParafin, " +
						"KTVDienXung = @KTVDienXung, " +
						"BSDienXung = @BSDienXung, " +
						"MoTaDienXung = @MoTaDienXung, " +
						"KTVTap = @KTVTap, " +
						"BSTap = @BSTap, " +
						"MoTaTap = @MoTaTap, " +
						"KTVGH = @KTVGH, " +
						"MoTaGH = @MoTaGH, " +

						"KQAll = @KQAll, " +
						"KQChamPTTT = @KQChamPTTT, " +
						"KQChamVT = @KQChamVT, " +
						"KQChamVTPT = @KQChamVTPT, " +
						"KQParafinPTTT = @KQParafinPTTT, " +
						"KQParafinVT = @KQParafinVT, " +
						"KQDienXungPTTT = @KQDienXungPTTT, " +
						"KQDienXungVT=@KQDienXungVT, " +
						"KQTapPTTT = @KQTapPTTT, " +
						"KQTapVT=@KQTapVT, " +
						"KQGHPTTT=@KQGHPTTT, " +
						"KQGHVT=@KQGHVT " +
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

			public async Task<bool> ManageExcelDataDTAsync(CP stud)
			{
				bool IsSave = false;
				if (stud.STT != "" && stud.STT != null)
				{
					await Conn.OpenAsync();
					Cmd = new OleDbCommand();
					Cmd.Connection = Conn;

					Cmd.Parameters.AddWithValue("@KQDTCOPY", stud.KQDTCOPY);
					Cmd.Parameters.AddWithValue("@KQDTSEND", stud.KQDTSEND);
					Cmd.Parameters.AddWithValue("@KQPTCOPY", stud.KQPTCOPY);
					Cmd.Parameters.AddWithValue("@STT", stud.STT);

					Cmd.CommandText = "Update [Data_DT$] set " +
						"KQDTCOPY = @KQDTCOPY, " +
						"KQDTSEND = @KQDTSEND, " +
						"KQPTTTCOPY = @KQPTCOPY " +
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

			/// <summary>  
			/// The method to check if the record is already available   
			/// in the workgroup  
			/// </summary>  
			/// <param name="emp"></param>  
			/// <returns></returns>  
			private async Task<bool> IsStudentRecordExistAsync(BN stud)
			{
				bool IsRecordExist = false;
				Cmd.CommandText = "Select * from [Data$] where STT = @STT";
				var Reader = await Cmd.ExecuteReaderAsync();
				if (Reader.HasRows)
				{
					IsRecordExist = true;
				}

				Reader.Close();
				return IsRecordExist;
			}
		}
	}
}
