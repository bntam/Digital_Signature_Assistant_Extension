using Microsoft.Office.Interop.Excel;
using Microsoft.VisualBasic;
using Microsoft.Win32;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.DevTools;
using OpenQA.Selenium.Firefox;
using OpenQA.Selenium.Interactions;
using OpenQA.Selenium.Support.UI;
using System;
using System.CodeDom;
using System.Collections;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Data;
using System.IO;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection.Metadata;
using System.Runtime.CompilerServices;
using System.Windows;
using System.Windows.Controls.Primitives;
using System.Windows.Media.Animation;
using System.Windows.Shapes;
using System.Xml.Linq;
using static Auto_ThuThuat.BNManage;
using static Auto_ThuThuat.ThuThuat;
using Actions = OpenQA.Selenium.Interactions.Actions;
using Window = System.Windows.Window;

namespace Auto_ThuThuat
{
	/// <summary>
	/// Interaction logic for MainWindow.xaml
	/// </summary>
	public partial class MainWindow : Window
	{
		ExcelDataService _objExcelSer;
		ExcelChiaTTDataService excelChiaTTDataService;
		ChromeDriver driver;
		List<string> logs;
		string ProfileFolderPath = "Profile";

		public MainWindow()
		{
			InitializeComponent();
		}

		/// <summary>  
		/// Getting Data From Excel Sheet  
		/// </summary>  
		/// <param name="sender"></param>  
		/// <param name="e"></param>  
		private void Window_Loaded(object sender, RoutedEventArgs e)
		{
			_objExcelSer = new ExcelDataService();
		}

		private async void Button_Chia_TT_Click(object sender, RoutedEventArgs e)
		{
			logs = new List<string> { };
			using StreamWriter file = new(AppDomain.CurrentDomain.BaseDirectory + "/Logs/" + "ChiaThuThuat-" + DateTime.Now.ToString("dd-MM-yyyy-HHmmss") + ".txt");

			try
			{
				excelChiaTTDataService = new ExcelChiaTTDataService();

				CD Setting = excelChiaTTDataService.ReadRecordCD().Result[0];
				ObservableCollection<TT> TTList = excelChiaTTDataService.ReadRecordTT().Result;
				ObservableCollection<BS> BSList = excelChiaTTDataService.ReadRecordBS().Result;

				ObservableCollection<BN> BNList = _objExcelSer.ReadRecordFromEXCELAsync().Result;
				var BNs = BNList.Where(x => x.STT != "").ToList();

				var TTRVs = TTList.Where(x => x.Name != "" && x.RaVien == "x").ToList();
				var TTs = TTList.Where(x => x.Name != "" && x.RaVien == "").ToList();
				var BSs = BSList.Where(x => x.STT != "" || x.Role != "").ToList();

				var TTs_BK = TTs;
				var BSs_BK = BSs;

				int soYS = BSs.Where(x => x.Role == "YS").ToList().Count;
				//int soBS = BSs.Where(x => x.Role == "BS").ToList().Count;

				// Init tham số
				int timeCham = 30;
				int timeMangCham = 30;
				int timeXung = 20;
				int timeHongNgoai = 15;
				int timeRongRoc = 20;
				int timeParafin = 20;
				int timeCay = 30;
				int timeXoatay = 30;
				int timeNgam = 20;
				int timeXong = 20;
				int timeBo = 20;
				int timeXoamay = 20;
				int timeCuu = 20;
				int timeGiacHoi = 10;

				int timeNext = 3;
				int countNgam = Int32.Parse(Setting.SLNgam);
				int countXong = Int32.Parse(Setting.SLXong);
				int countXung = Int32.Parse(Setting.SLXung);
				int countBo = Int32.Parse(Setting.SLBo);

				DateTime dateMorningStart = new DateTime(2025, 1, 1, Int32.Parse(Setting.MorningStart.Split(".")[0]), Int32.Parse(Setting.MorningStart.Split(".")[1]), 0);
				DateTime dateMorningEnd = new DateTime(2025, 1, 1, Int32.Parse(Setting.MorningEnd.Split(".")[0]), Int32.Parse(Setting.MorningEnd.Split(".")[1]), 0);
				DateTime datAfternoonStart = new DateTime(2025, 1, 1, Int32.Parse(Setting.AfternoonStart.Split(".")[0]), Int32.Parse(Setting.AfternoonStart.Split(".")[1]), 0);
				DateTime datAfternoonEnd = new DateTime(2025, 1, 1, Int32.Parse(Setting.AfternoonEnd.Split(".")[0]), Int32.Parse(Setting.AfternoonEnd.Split(".")[1]), 0);

				List<DateTime> dateTimes= new List<DateTime>();
				for (var d = dateMorningStart; d <= dateMorningEnd; d = d.AddMinutes(timeNext))
				{
					dateTimes.Add(d);
				}
				for (var d = datAfternoonStart; d <= datAfternoonEnd; d = d.AddMinutes(timeNext))
				{
					dateTimes.Add(d);
				}

				// Init mảng BS -> Giờ
				string[,] arrBS = new string[dateTimes.Count, BSs.Count];
				string[,] arrNameBS = new string[1, BSs.Count];
				//Init BS start
				DateTime[] arrBSStartTimeMorning = new DateTime[BSs.Count()];
				DateTime[] arrBSEndTimeMorning = new DateTime[BSs.Count()];
				DateTime[] arrBSSStartTimeAfternoon = new DateTime[BSs.Count()];
				DateTime[] arrBSEndTimeAfternoon = new DateTime[BSs.Count()];

				for (int i = BSs.Count - 1; i >= 0; i--)
				{
					arrNameBS[0, i] = BSs[i].Code;
					arrBSStartTimeMorning[i] = new DateTime(2025, 1, 1, int.Parse(BSs[i].StartTimeMorning.Split(".")[0]), int.Parse(BSs[i].StartTimeMorning.Split(".")[1]), 0); new DateTime(2025, 1, 1, int.Parse(BSs[i].StartTimeMorning.Split(".")[0]), int.Parse(BSs[i].StartTimeMorning.Split(".")[1]), 0);
					arrBSEndTimeMorning[i] = new DateTime(2025, 1, 1, int.Parse(BSs[i].EndTimeMorning.Split(".")[0]), int.Parse(BSs[i].EndTimeMorning.Split(".")[1]), 0); new DateTime(2025, 1, 1, int.Parse(BSs[i].EndTimeMorning.Split(".")[0]), int.Parse(BSs[i].EndTimeMorning.Split(".")[1]), 0);
					arrBSSStartTimeAfternoon[i] = new DateTime(2025, 1, 1, int.Parse(BSs[i].StartTimeAfternoon.Split(".")[0]), int.Parse(BSs[i].StartTimeAfternoon.Split(".")[1]), 0); new DateTime(2025, 1, 1, int.Parse(BSs[i].StartTimeAfternoon.Split(".")[0]), int.Parse(BSs[i].StartTimeAfternoon.Split(".")[1]), 0);
					arrBSEndTimeAfternoon[i] = new DateTime(2025, 1, 1, int.Parse(BSs[i].EndTimeAfternoon.Split(".")[0]), int.Parse(BSs[i].EndTimeAfternoon.Split(".")[1]), 0); new DateTime(2025, 1, 1, int.Parse(BSs[i].EndTimeAfternoon.Split(".")[0]), int.Parse(BSs[i].EndTimeAfternoon.Split(".")[1]), 0);
				}

				// Init list phút
				List<int> phutLst= new List<int>();
				for (int i = 1; i < 60; i = i + 3)
				{
					phutLst.Add(i);
				}

				// MAX time khám
				DateTime dateMorningStartOfBS = new DateTime(2025, 1, 1, 7, 0, 0);

				//Ra viện sớm
				logs.Add("");
				logs.Add("---------Start Khởi tạo Ra viện sớm ----------");
				foreach (TT tt in TTRVs)
				{
					logs.Add(tt.Name);
					//DateTime dateKhamStart = new DateTime(2025, 1, 1, int.Parse(tt.TimeKham.Split(".")[0]), int.Parse(tt.TimeKham.Split(".")[1]), 0);
					DateTime dateKhamEnd = new DateTime(2025, 1, 1, int.Parse(tt.TimeKham.Split(".")[0]), int.Parse(tt.TimeKham.Split(".")[1]), 0).AddMinutes(5);
					//
					//if (DateTime.Compare(dateKhamEnd, dateMorningStartOfBS) > 0)
					//{
					//	dateMorningStartOfBS = dateKhamEnd;
					//}

					var tempLst = phutLst.Find(x => x > dateKhamEnd.Minute);
					DateTime dateTemp = new DateTime(2025, 1, 1, dateKhamEnd.Hour, tempLst, 0);

					//DateTime dateTemp = new DateTime(2025, 1, 1, 7, 1, 0);

					if (!"".Equals(tt.ttNgam))
					{
						DateTime timeTTNgam = dateTemp.AddMinutes(Int32.Parse((string)tt.ttNgam));
						tt.ttNgam = timeTTNgam;
						tt.Ngam = timeTTNgam.ToString("HH:mm");
					}
					if (!"".Equals(tt.ttXong))
					{
						DateTime timeTTXong = dateTemp.AddMinutes(Int32.Parse((string)tt.ttXong));
						tt.ttXong = timeTTXong;
						tt.Xong = timeTTXong.ToString("HH:mm");
					}
					if (!"".Equals(tt.ttBo))
					{
						DateTime timeTTBo = dateTemp.AddMinutes(Int32.Parse((string)tt.ttBo));
						tt.ttBo = timeTTBo;
						tt.Bo = timeTTBo.ToString("HH:mm");
					}
					if (!"".Equals(tt.ttXoaMay))
					{
						DateTime timeTTXoaMay = dateTemp.AddMinutes(Int32.Parse((string)tt.ttXoaMay));
						tt.ttXoaMay = timeTTXoaMay;
						tt.XoaMay = timeTTXoaMay.ToString("HH:mm");

					}
					if (!"".Equals(tt.ttXoaTay))
					{
						DateTime timeTTXoaTay = dateTemp.AddMinutes(Int32.Parse((string)tt.ttXoaTay));
						tt.ttXoaTay = timeTTXoaTay;
						tt.XoaTay = timeTTXoaTay.ToString("HH:mm");
					}
					if (!"".Equals(tt.ttCuu))
					{
						DateTime timeTTCuu = dateTemp.AddMinutes(Int32.Parse((string)tt.ttCuu));
						tt.ttCuu = timeTTCuu;
						tt.Cuu = timeTTCuu.ToString("HH:mm");
					}
					if (!"".Equals(tt.ttGiacHoi))
					{
						DateTime timeTTGiacHoi = dateTemp.AddMinutes(Int32.Parse((string)tt.ttGiacHoi));
						tt.ttGiacHoi = timeTTGiacHoi;
						tt.GiacHoi = timeTTGiacHoi.ToString("HH:mm");
					}
					if (!"".Equals(tt.ttCham))
					{
						DateTime timeTTCham = dateTemp.AddMinutes(Int32.Parse((string)tt.ttCham));
						tt.ttCham = timeTTCham;
						tt.Cham = timeTTCham.ToString("HH:mm");
					}
					if (!"".Equals(tt.ttMangCham))
					{
						DateTime timeTTMangCham = dateTemp.AddMinutes(Int32.Parse((string)tt.ttMangCham));
						tt.ttMangCham = timeTTMangCham;
						tt.MangCham = timeTTMangCham.ToString("HH:mm");
					}
					if (!"".Equals(tt.ttXung))
					{
						DateTime timeTTXung = dateTemp.AddMinutes(Int32.Parse((string)tt.ttXung));
						tt.ttXung = timeTTXung;
						tt.Xung = timeTTXung.ToString("HH:mm");
					}
					if (!"".Equals(tt.HongNgoai))
					{
						DateTime timeTTHongNgoai = dateTemp.AddMinutes(Int32.Parse((string)tt.ttHongNgoai));
						tt.ttHongNgoai = timeTTHongNgoai;
						tt.HongNgoai = timeTTHongNgoai.ToString("HH:mm");
					}
					if (!"".Equals(tt.ttRongRoc))
					{
						DateTime timeTTRongRoc = dateTemp.AddMinutes(Int32.Parse((string)tt.ttRongRoc));
						tt.ttRongRoc = timeTTRongRoc;
						tt.RongRoc = timeTTRongRoc.ToString("HH:mm");
					}
					if (!"".Equals(tt.ttParafin))
					{
						DateTime timeTTParafin = dateTemp.AddMinutes(Int32.Parse((string)tt.ttParafin));
						tt.ttParafin = timeTTParafin;
						tt.Parafin = timeTTParafin.ToString("HH:mm");
					}
					if (!"".Equals(tt.ttCay))
					{
						DateTime timeTTCay = dateTemp.AddMinutes(Int32.Parse((string)tt.ttCay));
						tt.ttCay = timeTTCay;
						tt.Cay = timeTTCay.ToString("HH:mm");
					}

				}
				logs.Add("---------End Khởi tạo Ra viện sớm ----------");

				logs.Add("");
				logs.Add("---------Start Khởi tạo Khám bình thường ----------");
				foreach (TT tt in TTs)
				{
					logs.Add(tt.Name);
					DateTime dateKham = new DateTime(2025, 1, 1, int.Parse(tt.TimeKham.Split(".")[0]), int.Parse(tt.TimeKham.Split(".")[1]), 0).AddMinutes(5);
					

					var tempLst = phutLst.Find(x => x >= dateKham.Minute);
					DateTime dateTemp = new DateTime(2025, 1, 1, dateKham.Hour, tempLst, 0);

					if (!"".Equals(tt.ttCham))
					{
						DateTime timeTTCham = dateTemp.AddMinutes(Int32.Parse((string)tt.ttCham));
						tt.ttCham = timeTTCham;
						tt.Cham = timeTTCham.ToString("HH:mm");
					}
					if (!"".Equals(tt.ttMangCham))
					{
						DateTime timeTTMangCham = dateTemp.AddMinutes(Int32.Parse((string)tt.ttMangCham));
						tt.ttMangCham = timeTTMangCham;
						tt.MangCham = timeTTMangCham.ToString("HH:mm");
					}
					if (!"".Equals(tt.ttXung))
					{
						DateTime timeTTXung = dateTemp.AddMinutes(Int32.Parse((string)tt.ttXung));
						tt.ttXung = timeTTXung;
						tt.Xung = timeTTXung.ToString("HH:mm");
					}
					if (!"".Equals(tt.HongNgoai))
					{
						DateTime timeTTHongNgoai = dateTemp.AddMinutes(Int32.Parse((string)tt.ttHongNgoai));
						tt.ttHongNgoai = timeTTHongNgoai;
						tt.HongNgoai = timeTTHongNgoai.ToString("HH:mm");
					}
					if (!"".Equals(tt.ttRongRoc))
					{
						DateTime timeTTRongRoc = dateTemp.AddMinutes(Int32.Parse((string)tt.ttRongRoc));
						tt.ttRongRoc = timeTTRongRoc;
						tt.RongRoc = timeTTRongRoc.ToString("HH:mm");
					}
					if (!"".Equals(tt.ttParafin))
					{
						DateTime timeTTParafin = dateTemp.AddMinutes(Int32.Parse((string)tt.ttParafin));
						tt.ttParafin = timeTTParafin;
						tt.Parafin = timeTTParafin.ToString("HH:mm");
					}
					if (!"".Equals(tt.ttCay))
					{
						DateTime timeTTCay = dateTemp.AddMinutes(Int32.Parse((string)tt.ttCay));
						tt.ttCay = timeTTCay;
						tt.Cay = timeTTCay.ToString("HH:mm");
					}
					if (!"".Equals(tt.ttNgam))
					{
						DateTime timeTTNgam = dateTemp.AddMinutes(Int32.Parse((string)tt.ttNgam));
						tt.ttNgam = timeTTNgam;
						tt.Ngam = timeTTNgam.ToString("HH:mm");
					}
					if (!"".Equals(tt.ttXong))
					{
						DateTime timeTTXong = dateTemp.AddMinutes(Int32.Parse((string)tt.ttXong));
						tt.ttXong = timeTTXong;
						tt.Xong = timeTTXong.ToString("HH:mm");
					}
					if (!"".Equals(tt.ttBo))
					{
						DateTime timeTTBo = dateTemp.AddMinutes(Int32.Parse((string)tt.ttBo));
						tt.ttBo = timeTTBo;
						tt.Bo = timeTTBo.ToString("HH:mm");
					}
					if (!"".Equals(tt.ttXoaMay))
					{
						DateTime timeTTXoaMay = dateTemp.AddMinutes(Int32.Parse((string)tt.ttXoaMay));
						tt.ttXoaMay = timeTTXoaMay;
						tt.XoaMay = timeTTXoaMay.ToString("HH:mm");

					}
					if (!"".Equals(tt.ttXoaTay))
					{
						DateTime timeTTXoaTay = dateTemp.AddMinutes(Int32.Parse((string)tt.ttXoaTay));
						tt.ttXoaTay = timeTTXoaTay;
						tt.XoaTay = timeTTXoaTay.ToString("HH:mm");
					}
					if (!"".Equals(tt.ttCuu))
					{
						DateTime timeTTCuu = dateTemp.AddMinutes(Int32.Parse((string)tt.ttCuu));
						tt.ttCuu = timeTTCuu;
						tt.Cuu = timeTTCuu.ToString("HH:mm");
					}
					if (!"".Equals(tt.ttGiacHoi))
					{
						DateTime timeTTGiacHoi = dateTemp.AddMinutes(Int32.Parse((string)tt.ttGiacHoi));
						tt.ttGiacHoi = timeTTGiacHoi;
						tt.GiacHoi = timeTTGiacHoi.ToString("HH:mm");
					}
				}
				logs.Add("---------End Khởi tạo Khám bình thường ----------");

				// Đánh x time không làm
				logs.Add("");
				logs.Add("---------Start Đánh x time không làm ----------");
				for (int i = 0; i < arrBS.GetLength(0); i++)
				{
					for (int j = 0; j < arrBS.GetLength(1); j++)
					{
						// BS khám buổi sáng
						//if (DateTime.Compare(dateMorningStartOfBS, dateTimes[i]) > 0 && BSs[j].Role == "BS")
						//{
						//	arrBS[i, j] = "x";
						//}
						// Check giờ bắt đầu buổi sáng
						if (DateTime.Compare(arrBSStartTimeMorning[j], dateTimes[i]) > 0)
						{
							arrBS[i, j] = "x";
						}
						// Check giờ kết thúc buổi sáng
						if (DateTime.Compare(dateTimes[i], arrBSEndTimeMorning[j]) >= 0 && DateTime.Compare(dateTimes[i], dateMorningEnd) <= 0)
						{
							arrBS[i, j] = "x";
						}
						// Check giờ bắt đầu buổi chiều
						if (DateTime.Compare(dateTimes[i], datAfternoonStart) >= 0 && DateTime.Compare(dateTimes[i], arrBSSStartTimeAfternoon[j]) < 0 )
						{
							arrBS[i, j] = "x";
						}
						// Check giờ kết thúc buổi chiều
						if (DateTime.Compare(dateTimes[i], arrBSEndTimeAfternoon[j]) > 0)
						{
							arrBS[i, j] = "x";
						}
						// Nghỉ buổi sáng
						else if (DateTime.Compare(dateMorningEnd, dateTimes[i]) >= 0 && BSs[j].LeaveSang == "x")
						{
							arrBS[i, j] = "x";
						}
						// Nghỉ buổi chiều
						else if (DateTime.Compare(datAfternoonStart, dateTimes[i]) <= 0 && BSs[j].LeaveChieu == "x")
						{
							arrBS[i, j] = "x";
						}
					}
				}
				logs.Add("---------End Đánh x time không làm ----------");

				//Chia thủ thuật - Ra viện sớm
				logs.Add("");
				logs.Add("---------Start Chia thủ thuật - Ra viện sớm ----------");
				foreach (TT tt in TTRVs)
				{
					logs.Add("");
					// Ngâm
					if (!"".Equals(tt.ttNgam))
					{
						// dòng
						for (int i = 0; i < arrBS.GetLength(0); i++)
						{
							DateTime ttNgamTemp = (DateTime)tt.ttNgam;

							// Check làm đủ tới trưa không, nếu không chuyển qua đầu giờ chiều
							if ((DateTime.Compare(dateMorningEnd, ttNgamTemp) > 0 && DateTime.Compare(dateMorningEnd, ttNgamTemp.AddMinutes(timeNgam)) < 0) ||
								(DateTime.Compare(dateMorningEnd, ttNgamTemp) <= 0 && DateTime.Compare(datAfternoonStart, ttNgamTemp) > 0))
							{
								if (!"".Equals(tt.ttXong)) tt.ttXong = updateTimeTT(datAfternoonStart, (DateTime)tt.ttNgam, (DateTime)tt.ttXong);
								if (!"".Equals(tt.ttBo)) tt.ttBo = updateTimeTT(datAfternoonStart, (DateTime)tt.ttNgam, (DateTime)tt.ttBo);
								if (!"".Equals(tt.ttXoaMay)) tt.ttXoaMay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttNgam, (DateTime)tt.ttXoaMay);
								if (!"".Equals(tt.ttXoaTay)) tt.ttXoaTay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttNgam, (DateTime)tt.ttXoaTay);
								if (!"".Equals(tt.ttCuu)) tt.ttCuu = updateTimeTT(datAfternoonStart, (DateTime)tt.ttNgam, (DateTime)tt.ttCuu);
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(datAfternoonStart, (DateTime)tt.ttNgam, (DateTime)tt.ttGiacHoi);
								if (!"".Equals(tt.ttCham)) tt.ttCham = updateTimeTT(datAfternoonStart, (DateTime)tt.ttNgam, (DateTime)tt.ttCham);
								if (!"".Equals(tt.ttMangCham)) tt.ttMangCham = updateTimeTT(datAfternoonStart, (DateTime)tt.ttNgam, (DateTime)tt.ttMangCham);
								if (!"".Equals(tt.ttXung)) tt.ttXung = updateTimeTT(datAfternoonStart, (DateTime)tt.ttNgam, (DateTime)tt.ttXung);
								if (!"".Equals(tt.ttHongNgoai)) tt.ttHongNgoai = updateTimeTT(datAfternoonStart, (DateTime)tt.ttNgam, (DateTime)tt.ttHongNgoai);
								if (!"".Equals(tt.ttRongRoc)) tt.ttRongRoc = updateTimeTT(datAfternoonStart, (DateTime)tt.ttNgam, (DateTime)tt.ttRongRoc);
								if (!"".Equals(tt.ttParafin)) tt.ttParafin = updateTimeTT(datAfternoonStart, (DateTime)tt.ttNgam, (DateTime)tt.ttParafin);
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttNgam, (DateTime)tt.ttCay);
								

								tt.ttNgam = datAfternoonStart;
								tt.Ngam = datAfternoonStart.ToString("HH:mm");
								continue;
							}
							else
							{
								ttNgamTemp = (DateTime)tt.ttNgam;
							}

							// Check làm đủ tới tối không, nếu không sẽ log -> có thể tối ưu bước này
							if (DateTime.Compare(datAfternoonEnd, ttNgamTemp.AddMinutes(timeNgam)) < 0)
							{
								tt.Ngam = "x";
								goto LoopEndNgam;
							}
							else
							{
								ttNgamTemp = (DateTime)tt.ttNgam;
							}

							if (DateTime.Compare(dateTimes[i], ttNgamTemp) == 0)
							{
								int tempX = i - 7 < 0 ? 0 : i - 7;
								int tempY = i + 7 >= arrBS.GetLength(0) ? arrBS.GetLength(0) - 1 : i + 7;
								List<int> countDevice = new List<int>();
								for (int k = tempX; k <= tempY; k++)
								{
									int countTemp = 0;
									for (int j = 0; j < arrBS.GetLength(1); j++)
									{
										if (arrBS[k, j] != null && arrBS[k, j] != "x" && arrBS[k, j].Contains("Ngâm"))
										{
											countTemp++;
										}
									}
									countDevice.Add(countTemp);
								}

								if (tempX == 0 || tempY == arrBS.GetLength(0) - 1)
								{
									int total = countDevice.Sum();
									if (total >= countNgam)
									{
										goto LoopGotoNext;
									}
								}
								else
								{
									List<int> listCount = new List<int>();
									for (int idx = 0; idx < countDevice.Count; idx++)
									{
										if (idx + 7 < countDevice.Count)
										{
											int x = countDevice[idx] + countDevice[idx + 1] + countDevice[idx + 2] + countDevice[idx + 3] + countDevice[idx + 4] + countDevice[idx + 5] + countDevice[idx + 6];
											listCount.Add(x);
										}

									}
									foreach (int x in listCount)
									{
										if (x >= countNgam)
										{
											goto LoopGotoNext;
										}
									}
								}

								// cột
								for (int j = 0; j < arrBS.GetLength(1); j++)
								{
									if (!BSs[j].ThuThuat.Contains("NGAM"))
									{
										continue;
									}

									if (arrBS[i, j] == null)
									{
										// Check xem trước đó có xoa / cứu / giác hơi / ròng rọc / xung ko
										bool isXoaTay = false;
										bool isXoaMay = false;
										bool isCuu = false;
										bool isGiacHoi = false;
										bool isRongRoc = false;
										bool isXung = false;
										int tempKXoaTay = i - 10 <= 0 ? 0 : i - 10;
										int tempKXoaMay = i - 7 <= 0 ? 0 : i - 7;
										int tempKCuu = i - 7 <= 0 ? 0 : i - 7;
										int tempKRongRoc = i - 7 <= 0 ? 0 : i - 7;
										int tempKXung = i - 7 <= 0 ? 0 : i - 7;
										int tempKGiacHoi = i - 4 <= 0 ? 0 : i - 4;

										for (int k = tempKXoaTay; k < i; k++)
										{
											if (arrBS[k, j] != null)
											{
												if (arrBS[k, j].Contains("-Xoa Tay"))
												{
													isXoaTay = true;
													break;
												}
												else if ((k >= tempKXoaMay) && arrBS[k, j].Contains("-Xoa Máy"))
												{
													isXoaMay = true;
													break;
												}
												else if ((k >= tempKCuu) && arrBS[k, j].Contains("-Cứu"))
												{
													isCuu = true;
													break;
												}
												else if ((k >= tempKRongRoc) && arrBS[k, j].Contains("-Ròng Rọc"))
												{
													isRongRoc = true;
													break;
												}
												else if ((k >= tempKGiacHoi) && arrBS[k, j].Contains("-Giác Hơi"))
												{
													isGiacHoi = true;
													break;
												}
											}
										}
										if (isXoaTay || isXoaMay || isXung || isCuu || isRongRoc || isGiacHoi)
										{
											continue;
										}

										arrBS[i, j] = tt.Code + "-Ngâm";
										DateTime timeTemp = (DateTime)tt.ttNgam;
										tt.Ngam = timeTemp.ToString("HH:mm") + "-" + arrNameBS[0, j]; ;
										goto LoopEndNgam;
									}
								}

								LoopGotoNext:
								// Full -> thêm giờ kế tiếp
								DateTime timeTTNgam = ttNgamTemp.AddMinutes(timeNext);
								if (!"".Equals(tt.ttXong)) tt.ttXong = updateTimeTT(timeTTNgam, (DateTime)tt.ttNgam, (DateTime)tt.ttXong);
								if (!"".Equals(tt.ttBo)) tt.ttBo = updateTimeTT(timeTTNgam, (DateTime)tt.ttNgam, (DateTime)tt.ttBo);
								if (!"".Equals(tt.ttXoaMay)) tt.ttXoaMay = updateTimeTT(timeTTNgam, (DateTime)tt.ttNgam, (DateTime)tt.ttXoaMay);
								if (!"".Equals(tt.ttXoaTay)) tt.ttXoaTay = updateTimeTT(timeTTNgam, (DateTime)tt.ttNgam, (DateTime)tt.ttXoaTay);
								if (!"".Equals(tt.ttCuu)) tt.ttCuu = updateTimeTT(timeTTNgam, (DateTime)tt.ttNgam, (DateTime)tt.ttCuu);
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(timeTTNgam, (DateTime)tt.ttNgam, (DateTime)tt.ttGiacHoi);
								if (!"".Equals(tt.ttCham)) tt.ttCham = updateTimeTT(timeTTNgam, (DateTime)tt.ttNgam, (DateTime)tt.ttCham);
								if (!"".Equals(tt.ttMangCham)) tt.ttMangCham = updateTimeTT(timeTTNgam, (DateTime)tt.ttNgam, (DateTime)tt.ttMangCham);
								if (!"".Equals(tt.ttXung)) tt.ttXung = updateTimeTT(timeTTNgam, (DateTime)tt.ttNgam, (DateTime)tt.ttXung);
								if (!"".Equals(tt.ttHongNgoai)) tt.ttHongNgoai = updateTimeTT(timeTTNgam, (DateTime)tt.ttNgam, (DateTime)tt.ttHongNgoai);
								if (!"".Equals(tt.ttRongRoc)) tt.ttRongRoc = updateTimeTT(timeTTNgam, (DateTime)tt.ttNgam, (DateTime)tt.ttRongRoc);
								if (!"".Equals(tt.ttParafin)) tt.ttParafin = updateTimeTT(timeTTNgam, (DateTime)tt.ttNgam, (DateTime)tt.ttParafin);
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(timeTTNgam, (DateTime)tt.ttNgam, (DateTime)tt.ttCay);
								

								tt.ttNgam = timeTTNgam;
								tt.Ngam = timeTTNgam.ToString("HH:mm");
							}
						}
						LoopEndNgam:
						logs.Add(tt.Name + "\t\t\t" + "Ngâm-OK");

					}

					// Xông
					if (!"".Equals(tt.ttXong))
					{
						// dòng
						for (int i = 0; i < arrBS.GetLength(0); i++)
						{
							DateTime ttXongTemp = (DateTime)tt.ttXong;

							// Check làm đủ tới trưa không, nếu không chuyển qua đầu giờ chiều
							if ((DateTime.Compare(dateMorningEnd, ttXongTemp) > 0 && DateTime.Compare(dateMorningEnd, ttXongTemp.AddMinutes(timeXong)) < 0) ||
								(DateTime.Compare(dateMorningEnd, ttXongTemp) <= 0 && DateTime.Compare(datAfternoonStart, ttXongTemp) > 0))
							{
								if (!"".Equals(tt.ttBo)) tt.ttBo = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXong, (DateTime)tt.ttBo);
								if (!"".Equals(tt.ttXoaMay)) tt.ttXoaMay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXong, (DateTime)tt.ttXoaMay);
								if (!"".Equals(tt.ttXoaTay)) tt.ttXoaTay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXong, (DateTime)tt.ttXoaTay);
								if (!"".Equals(tt.ttCuu)) tt.ttCuu = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXong, (DateTime)tt.ttCuu);
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXong, (DateTime)tt.ttGiacHoi);
								if (!"".Equals(tt.ttCham)) tt.ttCham = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXong, (DateTime)tt.ttCham);
								if (!"".Equals(tt.ttMangCham)) tt.ttMangCham = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXong, (DateTime)tt.ttMangCham);
								if (!"".Equals(tt.ttXung)) tt.ttXung = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXong, (DateTime)tt.ttXung);
								if (!"".Equals(tt.ttHongNgoai)) tt.ttHongNgoai = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXong, (DateTime)tt.ttHongNgoai);
								if (!"".Equals(tt.ttRongRoc)) tt.ttRongRoc = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXong, (DateTime)tt.ttRongRoc);
								if (!"".Equals(tt.ttParafin)) tt.ttParafin = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXong, (DateTime)tt.ttParafin);
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXong, (DateTime)tt.ttCay);

								tt.ttXong = datAfternoonStart;
								tt.Xong = datAfternoonStart.ToString("HH:mm");
								continue;
							}
							else
							{
								ttXongTemp = (DateTime)tt.ttXong;
							}

							// Check làm đủ tới tối không, nếu không sẽ log -> có thể tối ưu bước này
							if (DateTime.Compare(datAfternoonEnd, ttXongTemp.AddMinutes(timeXong)) < 0)
							{
								Console.WriteLine("\nThủ thuật này ko đủ giờ làm");
								tt.Xong = "x";
								goto LoopEndXong;
							}
							else
							{
								ttXongTemp = (DateTime)tt.ttXong;
							}

							if (DateTime.Compare(dateTimes[i], ttXongTemp) == 0)
							{
								int tempX = i - 7 < 0 ? 0 : i - 7;
								int tempY = i + 7 >= arrBS.GetLength(0) ? arrBS.GetLength(0) - 1 : i + 7;
								List<int> countDevice = new List<int>();
								for (int k = tempX; k <= tempY; k++)
								{
									int countTempX = 0;
									for (int j = 0; j < arrBS.GetLength(1); j++)
									{
										if (arrBS[k, j] != null && arrBS[k, j] != "x" && arrBS[k, j].Contains("Xông"))
										{
											countTempX++;
										}
									}
									countDevice.Add(countTempX);
								}

								if (tempX == 0 || tempY == arrBS.GetLength(0) - 1)
								{
									int total = countDevice.Sum();
									if (total >= countXong)
									{
										goto LoopGotoNext;
									}
								}
								else
								{
									List<int> listCount = new List<int>();
									for (int idx = 0; idx < countDevice.Count; idx++)
									{
										if (idx + 7 < countDevice.Count)
										{
											int x = countDevice[idx] + countDevice[idx + 1] + countDevice[idx + 2] + countDevice[idx + 3] + countDevice[idx + 4] + countDevice[idx + 5] + countDevice[idx + 6];
											listCount.Add(x);
										}

									}
									foreach (int x in listCount)
									{
										if (x >= countXong)
										{
											goto LoopGotoNext;
										}
									}
								}

								// cột
								for (int j = 0; j < arrBS.GetLength(1); j++)
								{
									if (!BSs[j].ThuThuat.Contains("XONG"))
									{
										continue;
									}

									if (arrBS[i, j] == null)
									{
										// Check xem trước đó có xoa / cứu / giác hơi / ròng rọc / xung ko
										bool isXoaTay = false;
										bool isXoaMay = false;
										bool isCuu = false;
										bool isGiacHoi = false;
										bool isRongRoc = false;
										bool isXung = false;
										int tempKXoaTay = i - 10 <= 0 ? 0 : i - 10;
										int tempKXoaMay = i - 7 <= 0 ? 0 : i - 7;
										int tempKCuu = i - 7 <= 0 ? 0 : i - 7;
										int tempKRongRoc = i - 7 <= 0 ? 0 : i - 7;
										int tempKXung = i - 7 <= 0 ? 0 : i - 7;
										int tempKGiacHoi = i - 4 <= 0 ? 0 : i - 4;

										for (int k = tempKXoaTay; k < i; k++)
										{
											if (arrBS[k, j] != null)
											{
												if (arrBS[k, j].Contains("-Xoa Tay"))
												{
													isXoaTay = true;
													break;
												}
												else if ((k >= tempKXoaMay) && arrBS[k, j].Contains("-Xoa Máy"))
												{
													isXoaMay = true;
													break;
												}
												else if ((k >= tempKCuu) && arrBS[k, j].Contains("-Cứu"))
												{
													isCuu = true;
													break;
												}
												else if ((k >= tempKRongRoc) && arrBS[k, j].Contains("-Ròng Rọc"))
												{
													isRongRoc = true;
													break;
												}
												else if ((k >= tempKGiacHoi) && arrBS[k, j].Contains("-Giác Hơi"))
												{
													isGiacHoi = true;
													break;
												}
											}
										}
										if (isXoaTay || isXoaMay || isXung || isCuu || isRongRoc || isGiacHoi)
										{
											continue;
										}

										arrBS[i, j] = tt.Code + "-Xông";
										DateTime timeTemp = (DateTime)tt.ttXong;
										tt.Xong = timeTemp.ToString("HH:mm") + "-" + arrNameBS[0, j];
										goto LoopEndXong;
									}
								}

								LoopGotoNext:
								// Full -> thêm giờ kế tiếp
								DateTime timeTTXong = ttXongTemp.AddMinutes(timeNext);
								if (!"".Equals(tt.ttBo)) tt.ttBo = updateTimeTT(timeTTXong, (DateTime)tt.ttXong, (DateTime)tt.ttBo);
								if (!"".Equals(tt.ttXoaMay)) tt.ttXoaMay = updateTimeTT(timeTTXong, (DateTime)tt.ttXong, (DateTime)tt.ttXoaMay);
								if (!"".Equals(tt.ttXoaTay)) tt.ttXoaTay = updateTimeTT(timeTTXong, (DateTime)tt.ttXong, (DateTime)tt.ttXoaTay);
								if (!"".Equals(tt.ttCuu)) tt.ttCuu = updateTimeTT(timeTTXong, (DateTime)tt.ttXong, (DateTime)tt.ttCuu);
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(timeTTXong, (DateTime)tt.ttXong, (DateTime)tt.ttGiacHoi);
								if (!"".Equals(tt.ttCham)) tt.ttCham = updateTimeTT(timeTTXong, (DateTime)tt.ttXong, (DateTime)tt.ttCham);
								if (!"".Equals(tt.ttMangCham)) tt.ttMangCham = updateTimeTT(timeTTXong, (DateTime)tt.ttXong, (DateTime)tt.ttMangCham);
								if (!"".Equals(tt.ttXung)) tt.ttXung = updateTimeTT(timeTTXong, (DateTime)tt.ttXong, (DateTime)tt.ttXung);
								if (!"".Equals(tt.ttHongNgoai)) tt.ttHongNgoai = updateTimeTT(timeTTXong, (DateTime)tt.ttXong, (DateTime)tt.ttHongNgoai);
								if (!"".Equals(tt.ttRongRoc)) tt.ttRongRoc = updateTimeTT(timeTTXong, (DateTime)tt.ttXong, (DateTime)tt.ttRongRoc);
								if (!"".Equals(tt.ttParafin)) tt.ttParafin = updateTimeTT(timeTTXong, (DateTime)tt.ttXong, (DateTime)tt.ttParafin);
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(timeTTXong, (DateTime)tt.ttXong, (DateTime)tt.ttCay);
								
								tt.ttXong = timeTTXong;
								tt.Xong = timeTTXong.ToString("HH:mm");
							}
						}
						LoopEndXong:
						logs.Add(tt.Name + "\t\t\t" + "Xông-OK");

					}

					// Bó
					if (!"".Equals(tt.ttBo))
					{
						// dòng
						for (int i = 0; i < arrBS.GetLength(0); i++)
						{
							DateTime ttBoTemp = (DateTime)tt.ttBo;

							// Check làm đủ tới trưa không, nếu không chuyển qua đầu giờ chiều
							if ((DateTime.Compare(dateMorningEnd, ttBoTemp) > 0 && DateTime.Compare(dateMorningEnd, ttBoTemp.AddMinutes(timeBo)) < 0) ||
								(DateTime.Compare(dateMorningEnd, ttBoTemp) <= 0 && DateTime.Compare(datAfternoonStart, ttBoTemp) > 0))
							{
								if (!"".Equals(tt.ttXoaMay)) tt.ttXoaMay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttBo, (DateTime)tt.ttXoaMay);
								if (!"".Equals(tt.ttXoaTay)) tt.ttXoaTay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttBo, (DateTime)tt.ttXoaTay);
								if (!"".Equals(tt.ttCuu)) tt.ttCuu = updateTimeTT(datAfternoonStart, (DateTime)tt.ttBo, (DateTime)tt.ttCuu);
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(datAfternoonStart, (DateTime)tt.ttBo, (DateTime)tt.ttGiacHoi);
								if (!"".Equals(tt.ttCham)) tt.ttCham = updateTimeTT(datAfternoonStart, (DateTime)tt.ttBo, (DateTime)tt.ttCham);
								if (!"".Equals(tt.ttMangCham)) tt.ttMangCham = updateTimeTT(datAfternoonStart, (DateTime)tt.ttBo, (DateTime)tt.ttMangCham);
								if (!"".Equals(tt.ttXung)) tt.ttXung = updateTimeTT(datAfternoonStart, (DateTime)tt.ttBo, (DateTime)tt.ttXung);
								if (!"".Equals(tt.ttHongNgoai)) tt.ttHongNgoai = updateTimeTT(datAfternoonStart, (DateTime)tt.ttBo, (DateTime)tt.ttHongNgoai);
								if (!"".Equals(tt.ttRongRoc)) tt.ttRongRoc = updateTimeTT(datAfternoonStart, (DateTime)tt.ttBo, (DateTime)tt.ttRongRoc);
								if (!"".Equals(tt.ttParafin)) tt.ttParafin = updateTimeTT(datAfternoonStart, (DateTime)tt.ttBo, (DateTime)tt.ttParafin);
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttBo, (DateTime)tt.ttCay);

								tt.ttBo = datAfternoonStart;
								tt.Bo = datAfternoonStart.ToString("HH:mm");
								continue;
							}
							else
							{
								ttBoTemp = (DateTime)tt.ttBo;
							}

							// Check làm đủ tới tối không, nếu không sẽ log -> có thể tối ưu bước này
							if (DateTime.Compare(datAfternoonEnd, ttBoTemp.AddMinutes(timeBo)) < 0)
							{
								Console.WriteLine("\nThủ thuật này ko đủ giờ làm");
								tt.Bo = "x";
								goto LoopEndBo;
							}
							else
							{
								ttBoTemp = (DateTime)tt.ttBo;
							}

							if (DateTime.Compare(dateTimes[i], ttBoTemp) == 0)
							{
								int tempX = i - 7 < 0 ? 0 : i - 7;
								int tempY = i + 7 >= arrBS.GetLength(0) ? arrBS.GetLength(0) - 1 : i + 7;
								List<int> countDevice = new List<int>();
								for (int k = tempX; k <= tempY; k++)
								{
									int countTempX = 0;
									for (int j = 0; j < arrBS.GetLength(1); j++)
									{
										if (arrBS[k, j] != null && arrBS[k, j] != "x" && arrBS[k, j].Contains("Bó"))
										{
											countTempX++;
										}
									}
									countDevice.Add(countTempX);
								}

								if (tempX == 0 || tempY == arrBS.GetLength(0) - 1)
								{
									int total = countDevice.Sum();
									if (total >= countBo)
									{
										goto LoopGotoNext;
									}
								}
								else
								{
									List<int> listCount = new List<int>();
									for (int idx = 0; idx < countDevice.Count; idx++)
									{
										if (idx + 7 < countDevice.Count)
										{
											int x = countDevice[idx] + countDevice[idx + 1] + countDevice[idx + 2] + countDevice[idx + 3] + countDevice[idx + 4] + countDevice[idx + 5] + countDevice[idx + 6];
											listCount.Add(x);
										}

									}
									foreach (int x in listCount)
									{
										if (x >= countBo)
										{
											goto LoopGotoNext;
										}
									}
								}

								// cột
								for (int j = 0; j < arrBS.GetLength(1); j++)
								{
									if (!BSs[j].ThuThuat.Contains("BO"))
									{
										continue;
									}

									if (arrBS[i, j] == null)
									{
										// Check xem trước đó có xoa / cứu / giác hơi / ròng rọc / xung ko
										bool isXoaTay = false;
										bool isXoaMay = false;
										bool isCuu = false;
										bool isGiacHoi = false;
										bool isRongRoc = false;
										bool isXung = false;
										int tempKXoaTay = i - 10 <= 0 ? 0 : i - 10;
										int tempKXoaMay = i - 7 <= 0 ? 0 : i - 7;
										int tempKCuu = i - 7 <= 0 ? 0 : i - 7;
										int tempKRongRoc = i - 7 <= 0 ? 0 : i - 7;
										int tempKXung = i - 7 <= 0 ? 0 : i - 7;
										int tempKGiacHoi = i - 4 <= 0 ? 0 : i - 4;

										for (int k = tempKXoaTay; k < i; k++)
										{
											if (arrBS[k, j] != null)
											{
												if (arrBS[k, j].Contains("-Xoa Tay"))
												{
													isXoaTay = true;
													break;
												}
												else if ((k >= tempKXoaMay) && arrBS[k, j].Contains("-Xoa Máy"))
												{
													isXoaMay = true;
													break;
												}
												else if ((k >= tempKCuu) && arrBS[k, j].Contains("-Cứu"))
												{
													isCuu = true;
													break;
												}
												else if ((k >= tempKRongRoc) && arrBS[k, j].Contains("-Ròng Rọc"))
												{
													isRongRoc = true;
													break;
												}
												else if ((k >= tempKGiacHoi) && arrBS[k, j].Contains("-Giác Hơi"))
												{
													isGiacHoi = true;
													break;
												}
											}
										}
										if (isXoaTay || isXoaMay || isXung || isCuu || isRongRoc || isGiacHoi)
										{
											continue;
										}

										arrBS[i, j] = tt.Code + "-Bó";
										DateTime timeTemp = (DateTime)tt.ttBo;
										tt.Bo = timeTemp.ToString("HH:mm") + "-" + arrNameBS[0, j];
										goto LoopEndBo;
									}
								}

								LoopGotoNext:
								// Full -> thêm giờ kế tiếp
								DateTime timeTTBo = ttBoTemp.AddMinutes(timeNext);
								if (!"".Equals(tt.ttXoaMay)) tt.ttXoaMay = updateTimeTT(timeTTBo, (DateTime)tt.ttBo, (DateTime)tt.ttXoaMay);
								if (!"".Equals(tt.ttXoaTay)) tt.ttXoaTay = updateTimeTT(timeTTBo, (DateTime)tt.ttBo, (DateTime)tt.ttXoaTay);
								if (!"".Equals(tt.ttCuu)) tt.ttCuu = updateTimeTT(timeTTBo, (DateTime)tt.ttBo, (DateTime)tt.ttCuu);
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(timeTTBo, (DateTime)tt.ttBo, (DateTime)tt.ttGiacHoi);
								if (!"".Equals(tt.ttCham)) tt.ttCham = updateTimeTT(timeTTBo, (DateTime)tt.ttBo, (DateTime)tt.ttCham);
								if (!"".Equals(tt.ttMangCham)) tt.ttMangCham = updateTimeTT(timeTTBo, (DateTime)tt.ttBo, (DateTime)tt.ttMangCham);
								if (!"".Equals(tt.ttXung)) tt.ttXung = updateTimeTT(timeTTBo, (DateTime)tt.ttBo, (DateTime)tt.ttXung);
								if (!"".Equals(tt.ttHongNgoai)) tt.ttHongNgoai = updateTimeTT(timeTTBo, (DateTime)tt.ttBo, (DateTime)tt.ttHongNgoai);
								if (!"".Equals(tt.ttRongRoc)) tt.ttRongRoc = updateTimeTT(timeTTBo, (DateTime)tt.ttBo, (DateTime)tt.ttRongRoc);
								if (!"".Equals(tt.ttParafin)) tt.ttParafin = updateTimeTT(timeTTBo, (DateTime)tt.ttBo, (DateTime)tt.ttParafin);
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(timeTTBo, (DateTime)tt.ttBo, (DateTime)tt.ttCay);
								
								tt.ttBo = timeTTBo;
								tt.Bo = timeTTBo.ToString("HH:mm");
							}
						}
						LoopEndBo:
						logs.Add(tt.Name + "\t\t\t" + "Bó-OK");

					}

					// Xoa máy
					if (!"".Equals(tt.ttXoaMay))
					{
						// dòng
						for (int i = 0; i < arrBS.GetLength(0); i++)
						{
							DateTime ttXoaMayTemp = (DateTime)tt.ttXoaMay;

							// Check làm đủ tới trưa không, nếu không chuyển qua đầu giờ chiều
							if ((DateTime.Compare(dateMorningEnd, ttXoaMayTemp) > 0 && DateTime.Compare(dateMorningEnd, ttXoaMayTemp.AddMinutes(timeXoamay)) < 0) ||
								(DateTime.Compare(dateMorningEnd, ttXoaMayTemp) <= 0 && DateTime.Compare(datAfternoonStart, ttXoaMayTemp) > 0))
							{
								if (!"".Equals(tt.ttXoaTay)) tt.ttXoaTay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXoaMay, (DateTime)tt.ttXoaTay);
								if (!"".Equals(tt.ttCuu)) tt.ttCuu = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXoaMay, (DateTime)tt.ttCuu);
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXoaMay, (DateTime)tt.ttGiacHoi);
								if (!"".Equals(tt.ttCham)) tt.ttCham = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXoaMay, (DateTime)tt.ttCham);
								if (!"".Equals(tt.ttMangCham)) tt.ttMangCham = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXoaMay, (DateTime)tt.ttMangCham);
								if (!"".Equals(tt.ttXung)) tt.ttXung = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXoaMay, (DateTime)tt.ttXung);
								if (!"".Equals(tt.ttHongNgoai)) tt.ttHongNgoai = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXoaMay, (DateTime)tt.ttHongNgoai);
								if (!"".Equals(tt.ttRongRoc)) tt.ttRongRoc = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXoaMay, (DateTime)tt.ttRongRoc);
								if (!"".Equals(tt.ttParafin)) tt.ttParafin = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXoaMay, (DateTime)tt.ttParafin);
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXoaMay, (DateTime)tt.ttCay);

								tt.ttXoaMay = datAfternoonStart;
								tt.XoaMay = datAfternoonStart.ToString("HH:mm");
								continue;
							}
							else
							{
								ttXoaMayTemp = (DateTime)tt.ttXoaMay;
							}

							// Check làm đủ tới tối không, nếu không sẽ log -> có thể tối ưu bước này
							if (DateTime.Compare(datAfternoonEnd, ttXoaMayTemp.AddMinutes(timeXoamay)) < 0)
							{
								Console.WriteLine("\nThủ thuật này ko đủ giờ làm");
								tt.XoaMay = "x";
								goto LoopEndXoaMay;
							}
							else
							{
								ttXoaMayTemp = (DateTime)tt.ttXoaMay;
							}

							if (DateTime.Compare(dateTimes[i], ttXoaMayTemp) == 0)
							{
								// cột
								for (int j = 0; j < arrBS.GetLength(1); j++)
								{
									if (!BSs[j].ThuThuat.Contains("XOAMAY"))
									{
										continue;
									}

									if (arrBS[i, j] == null)
									{
										// Check xem trước & sau đó có xoa / cứu / giác hơi / ròng rọc / xung ko
										bool isXoaTay = false;
										bool isXoaMay = false;
										bool isCuu = false;
										bool isGiacHoi = false;
										bool isRongRoc = false;
										bool isXung = false;
										int tempKXoaTay = i - 10 <= 0 ? 0 : i - 10;
										int tempKXoaMay = i - 7 <= 0 ? 0 : i - 7;
										int tempKCuu = i - 7 <= 0 ? 0 : i - 7;
										int tempKRongRoc = i - 7 <= 0 ? 0 : i - 7;
										int tempKXung = i - 7 <= 0 ? 0 : i - 7;
										int tempKGiacHoi = i - 4 <= 0 ? 0 : i - 4;
										int tempIXT = i + 10 >= arrBS.GetLength(0) ? arrBS.GetLength(0) - 1 : i + 10;
										int tempIXM = i + 7 >= arrBS.GetLength(0) ? arrBS.GetLength(0) - 1 : i + 7;

										for (int k = tempKXoaTay; k < i; k++)
										{
											if (arrBS[k, j] != null && arrBS[k, j] != "x")
											{
												if (arrBS[k, j].Contains("-Xoa Tay"))
												{
													isXoaTay = true;
													break;
												}
												else if ((k >= tempKXoaMay) && arrBS[k, j].Contains("-Xoa Máy"))
												{
													isXoaMay = true;
													break;
												}
												else if ((k >= tempKCuu) && arrBS[k, j].Contains("-Cứu"))
												{
													isCuu = true;
													break;
												}
												else if ((k >= tempKRongRoc) && arrBS[k, j].Contains("-Ròng Rọc"))
												{
													isRongRoc = true;
													break;
												}
												else if ((k >= tempKGiacHoi) && arrBS[k, j].Contains("-Giác Hơi"))
												{
													isGiacHoi = true;
													break;
												}
											}
										}

										// Kiểm tra đủ time xoa máy ko
										for (int k = i; k <= tempIXM; k++)
										{
											if (arrBS[k, j] != null && arrBS[k, j] != "x")
											{
												isXoaMay = true;
												break;
											}
										}
										if (isXoaTay || isXoaMay || isXung || isCuu || isRongRoc || isGiacHoi)
										{
											continue;
										}

										arrBS[i, j] = tt.Code + "-Xoa Máy";
										DateTime timeTemp = (DateTime)tt.ttXoaMay;
										tt.XoaMay = timeTemp.ToString("HH:mm") + "-" + arrNameBS[0, j];
										goto LoopEndXoaMay;
									}
								}

								// Full -> thêm giờ kế tiếp
								DateTime timeTTXoaMay = ttXoaMayTemp.AddMinutes(timeNext);
								if (!"".Equals(tt.ttXoaTay)) tt.ttXoaTay = updateTimeTT(timeTTXoaMay, (DateTime)tt.ttXoaMay, (DateTime)tt.ttXoaTay);
								if (!"".Equals(tt.ttCuu)) tt.ttCuu = updateTimeTT(timeTTXoaMay, (DateTime)tt.ttXoaMay, (DateTime)tt.ttCuu);
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(timeTTXoaMay, (DateTime)tt.ttXoaMay, (DateTime)tt.ttGiacHoi);
								if (!"".Equals(tt.ttCham)) tt.ttCham = updateTimeTT(timeTTXoaMay, (DateTime)tt.ttXoaMay, (DateTime)tt.ttCham);
								if (!"".Equals(tt.ttMangCham)) tt.ttMangCham = updateTimeTT(timeTTXoaMay, (DateTime)tt.ttXoaMay, (DateTime)tt.ttMangCham);
								if (!"".Equals(tt.ttXung)) tt.ttXung = updateTimeTT(timeTTXoaMay, (DateTime)tt.ttXoaMay, (DateTime)tt.ttXung);
								if (!"".Equals(tt.ttHongNgoai)) tt.ttHongNgoai = updateTimeTT(timeTTXoaMay, (DateTime)tt.ttXoaMay, (DateTime)tt.ttHongNgoai);
								if (!"".Equals(tt.ttRongRoc)) tt.ttRongRoc = updateTimeTT(timeTTXoaMay, (DateTime)tt.ttXoaMay, (DateTime)tt.ttRongRoc);
								if (!"".Equals(tt.ttParafin)) tt.ttParafin = updateTimeTT(timeTTXoaMay, (DateTime)tt.ttXoaMay, (DateTime)tt.ttParafin);
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(timeTTXoaMay, (DateTime)tt.ttXoaMay, (DateTime)tt.ttCay);
								

								tt.ttXoaMay = timeTTXoaMay;
								tt.XoaMay = timeTTXoaMay.ToString("HH:mm");
							}
						}
						LoopEndXoaMay:
						logs.Add(tt.Name + "\t\t\t" + "Xoa Máy-OK");

					}

					// Xoa tay
					if (!"".Equals(tt.ttXoaTay))
					{
						// dòng
						for (int i = 0; i < arrBS.GetLength(0); i++)
						{
							DateTime ttXoaTayTemp = (DateTime)tt.ttXoaTay;

							// Check làm đủ tới trưa không, nếu không chuyển qua đầu giờ chiều
							if ((DateTime.Compare(dateMorningEnd, ttXoaTayTemp) > 0 && DateTime.Compare(dateMorningEnd, ttXoaTayTemp.AddMinutes(timeXoatay)) < 0) ||
								(DateTime.Compare(dateMorningEnd, ttXoaTayTemp) <= 0 && DateTime.Compare(datAfternoonStart, ttXoaTayTemp) > 0))
							{
								if (!"".Equals(tt.ttCuu)) tt.ttCuu = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXoaTay, (DateTime)tt.ttCuu);
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXoaTay, (DateTime)tt.ttGiacHoi);
								if (!"".Equals(tt.ttCham)) tt.ttCham = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXoaTay, (DateTime)tt.ttCham);
								if (!"".Equals(tt.ttMangCham)) tt.ttMangCham = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXoaTay, (DateTime)tt.ttMangCham);
								if (!"".Equals(tt.ttXung)) tt.ttXung = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXoaTay, (DateTime)tt.ttXung);
								if (!"".Equals(tt.ttHongNgoai)) tt.ttHongNgoai = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXoaTay, (DateTime)tt.ttHongNgoai);
								if (!"".Equals(tt.ttRongRoc)) tt.ttRongRoc = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXoaTay, (DateTime)tt.ttRongRoc);
								if (!"".Equals(tt.ttParafin)) tt.ttParafin = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXoaTay, (DateTime)tt.ttParafin);
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXoaTay, (DateTime)tt.ttCay);

								tt.ttXoaTay = datAfternoonStart;
								tt.XoaTay = datAfternoonStart.ToString("HH:mm");
								continue;
							}
							else
							{
								ttXoaTayTemp = (DateTime)tt.ttXoaTay;
							}

							// Check làm đủ tới tối không, nếu không sẽ log -> có thể tối ưu bước này
							if (DateTime.Compare(datAfternoonEnd, ttXoaTayTemp.AddMinutes(timeXoatay)) < 0)
							{
								Console.WriteLine("\nThủ thuật này ko đủ giờ làm");
								tt.XoaTay = "x";
								goto LoopEndXoaTay;
							}
							else
							{
								ttXoaTayTemp = (DateTime)tt.ttXoaTay;
							}

							if (DateTime.Compare(dateTimes[i], ttXoaTayTemp) == 0)
							{
								// cột
								for (int j = 0; j < arrBS.GetLength(1); j++)
								{
									if (!BSs[j].ThuThuat.Contains("XOATAY"))
									{
										continue;
									}


									if (arrBS[i, j] == null)
									{
										// Check xem trước & sau đó có xoa / cứu / giác hơi / ròng rọc / xung ko
										bool isXoaTay = false;
										bool isXoaMay = false;
										bool isCuu = false;
										bool isGiacHoi = false;
										bool isRongRoc = false;
										bool isXung = false;
										int tempKXoaTay = i - 10 <= 0 ? 0 : i - 10;
										int tempKXoaMay = i - 7 <= 0 ? 0 : i - 7;
										int tempKCuu = i - 7 <= 0 ? 0 : i - 7;
										int tempKRongRoc = i - 7 <= 0 ? 0 : i - 7;
										int tempKXung = i - 7 <= 0 ? 0 : i - 7;
										int tempKGiacHoi = i - 4 <= 0 ? 0 : i - 4;
										int tempIXT = i + 10 >= arrBS.GetLength(0) ? arrBS.GetLength(0) - 1 : i + 10;
										int tempIXM = i + 7 >= arrBS.GetLength(0) ? arrBS.GetLength(0) - 1 : i + 7;

										for (int k = tempKXoaTay; k < i; k++)
										{
											if (arrBS[k, j] != null && arrBS[k, j] != "x")
											{
												if (arrBS[k, j].Contains("-Xoa Tay"))
												{
													isXoaTay = true;
													break;
												}
												else if ((k >= tempKXoaMay) && arrBS[k, j].Contains("-Xoa Máy"))
												{
													isXoaMay = true;
													break;
												}
												else if ((k >= tempKCuu) && arrBS[k, j].Contains("-Cứu"))
												{
													isCuu = true;
													break;
												}
												else if ((k >= tempKRongRoc) && arrBS[k, j].Contains("-Ròng Rọc"))
												{
													isRongRoc = true;
													break;
												}
												else if ((k >= tempKGiacHoi) && arrBS[k, j].Contains("-Giác Hơi"))
												{
													isGiacHoi = true;
													break;
												}
											}
										}
										for (int k = i; k <= tempIXT; k++)
										{
											if (arrBS[k, j] != null && arrBS[k, j] != "x")
											{
												isXoaTay = true;
												break;
											}
										}
										if (isXoaTay || isXoaMay || isXung || isCuu || isRongRoc || isGiacHoi)
										{
											continue;
										}

										arrBS[i, j] = tt.Code + "-Xoa Tay";
										DateTime timeTemp = (DateTime)tt.ttXoaTay;
										tt.XoaTay = timeTemp.ToString("HH:mm") + "-" + arrNameBS[0, j];
										goto LoopEndXoaTay;
									}
								}

								// Full -> thêm giờ kế tiếp
								DateTime timeTTXoaTay = ttXoaTayTemp.AddMinutes(timeNext);
								if (!"".Equals(tt.ttCuu)) tt.ttCuu = updateTimeTT(timeTTXoaTay, (DateTime)tt.ttXoaTay, (DateTime)tt.ttCuu);
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(timeTTXoaTay, (DateTime)tt.ttXoaTay, (DateTime)tt.ttGiacHoi);
								if (!"".Equals(tt.ttCham)) tt.ttCham = updateTimeTT(timeTTXoaTay, (DateTime)tt.ttXoaTay, (DateTime)tt.ttCham);
								if (!"".Equals(tt.ttMangCham)) tt.ttMangCham = updateTimeTT(timeTTXoaTay, (DateTime)tt.ttXoaTay, (DateTime)tt.ttMangCham);
								if (!"".Equals(tt.ttXung)) tt.ttXung = updateTimeTT(timeTTXoaTay, (DateTime)tt.ttXoaTay, (DateTime)tt.ttXung);
								if (!"".Equals(tt.ttHongNgoai)) tt.ttHongNgoai = updateTimeTT(timeTTXoaTay, (DateTime)tt.ttXoaTay, (DateTime)tt.ttHongNgoai);
								if (!"".Equals(tt.ttRongRoc)) tt.ttRongRoc = updateTimeTT(timeTTXoaTay, (DateTime)tt.ttXoaTay, (DateTime)tt.ttRongRoc);
								if (!"".Equals(tt.ttParafin)) tt.ttParafin = updateTimeTT(timeTTXoaTay, (DateTime)tt.ttXoaTay, (DateTime)tt.ttParafin);
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(timeTTXoaTay, (DateTime)tt.ttXoaTay, (DateTime)tt.ttCay);

								tt.ttXoaTay = timeTTXoaTay;
								tt.XoaTay = timeTTXoaTay.ToString("HH:mm");
							}
						}
						LoopEndXoaTay:
						logs.Add(tt.Name + "\t\t\t" + "Xoa Tay-OK");

					}

					// Cứu
					if (!"".Equals(tt.ttCuu))
					{
						// dòng
						for (int i = 0; i < arrBS.GetLength(0); i++)
						{
							DateTime ttCuuTemp = (DateTime)tt.ttCuu;

							// Check làm đủ tới trưa không, nếu không chuyển qua đầu giờ chiều
							if ((DateTime.Compare(dateMorningEnd, ttCuuTemp) > 0 && DateTime.Compare(dateMorningEnd, ttCuuTemp.AddMinutes(timeCuu)) < 0) ||
								(DateTime.Compare(dateMorningEnd, ttCuuTemp) <= 0 && DateTime.Compare(datAfternoonStart, ttCuuTemp) > 0))
							{
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(datAfternoonStart, (DateTime)tt.ttCuu, (DateTime)tt.ttGiacHoi);
								if (!"".Equals(tt.ttCham)) tt.ttCham = updateTimeTT(datAfternoonStart, (DateTime)tt.ttCuu, (DateTime)tt.ttCham);
								if (!"".Equals(tt.ttMangCham)) tt.ttMangCham = updateTimeTT(datAfternoonStart, (DateTime)tt.ttCuu, (DateTime)tt.ttMangCham);
								if (!"".Equals(tt.ttXung)) tt.ttXung = updateTimeTT(datAfternoonStart, (DateTime)tt.ttCuu, (DateTime)tt.ttXung);
								if (!"".Equals(tt.ttHongNgoai)) tt.ttHongNgoai = updateTimeTT(datAfternoonStart, (DateTime)tt.ttCuu, (DateTime)tt.ttHongNgoai);
								if (!"".Equals(tt.ttRongRoc)) tt.ttRongRoc = updateTimeTT(datAfternoonStart, (DateTime)tt.ttCuu, (DateTime)tt.ttRongRoc);
								if (!"".Equals(tt.ttParafin)) tt.ttParafin = updateTimeTT(datAfternoonStart, (DateTime)tt.ttCuu, (DateTime)tt.ttParafin);
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttCuu, (DateTime)tt.ttCay);

								tt.ttCuu = datAfternoonStart;
								tt.Cuu = datAfternoonStart.ToString("HH:mm");
								continue;
							}
							else
							{
								ttCuuTemp = (DateTime)tt.ttCuu;
							}

							// Check làm đủ tới tối không, nếu không sẽ log -> có thể tối ưu bước này
							if (DateTime.Compare(datAfternoonEnd, ttCuuTemp.AddMinutes(timeCuu)) < 0)
							{
								Console.WriteLine("\nThủ thuật này ko đủ giờ làm");
								tt.Cuu = "x";
								goto LoopEndCuu;
							}
							else
							{
								ttCuuTemp = (DateTime)tt.ttCuu;
							}

							if (DateTime.Compare(dateTimes[i], ttCuuTemp) == 0)
							{
								// cột
								for (int j = 0; j < arrBS.GetLength(1); j++)
								{
									if (!BSs[j].ThuThuat.Contains("CUU"))
									{
										continue;
									}

									if (arrBS[i, j] == null)
									{
										// Check xem trước & sau đó có xoa / cứu / giác hơi / ròng rọc / xung ko
										bool isXoaTay = false;
										bool isXoaMay = false;
										bool isCuu = false;
										bool isGiacHoi = false;
										bool isRongRoc = false;
										bool isXung = false;
										int tempKXoaTay = i - 10 <= 0 ? 0 : i - 10;
										int tempKXoaMay = i - 7 <= 0 ? 0 : i - 7;
										int tempKCuu = i - 7 <= 0 ? 0 : i - 7;
										int tempKRongRoc = i - 7 <= 0 ? 0 : i - 7;
										int tempKXung = i - 7 <= 0 ? 0 : i - 7;
										int tempKGiacHoi = i - 4 <= 0 ? 0 : i - 4;
										int tempICuu = i + 7 >= arrBS.GetLength(0) ? arrBS.GetLength(0) - 1 : i + 7;

										for (int k = tempKXoaTay; k < i; k++)
										{
											if (arrBS[k, j] != null && arrBS[k, j] != "x")
											{
												if (arrBS[k, j].Contains("-Xoa Tay"))
												{
													isXoaTay = true;
													break;
												}
												else if ((k >= tempKXoaMay) && arrBS[k, j].Contains("-Xoa Máy"))
												{
													isXoaMay = true;
													break;
												}
												else if ((k >= tempKCuu) && arrBS[k, j].Contains("-Cứu"))
												{
													isCuu = true;
													break;
												}
												else if ((k >= tempKRongRoc) && arrBS[k, j].Contains("-Ròng Rọc"))
												{
													isRongRoc = true;
													break;
												}
												else if ((k >= tempKGiacHoi) && arrBS[k, j].Contains("-Giác Hơi"))
												{
													isGiacHoi = true;
													break;
												}
											}
										}
										for (int k = i; k <= tempICuu; k++)
										{
											if (arrBS[k, j] != null && arrBS[k, j] != "x")
											{
												isCuu = true;
												break;
											}
										}
										if (isXoaTay || isXoaMay || isXung || isCuu || isRongRoc || isGiacHoi)
										{
											continue;
										}

										arrBS[i, j] = tt.Code + "-Cứu";
										DateTime timeTemp = (DateTime)tt.ttCuu;
										tt.Cuu = timeTemp.ToString("HH:mm") + "-" + arrNameBS[0, j];
										goto LoopEndCuu;
									}
								}

								// Full -> thêm giờ kế tiếp
								DateTime timeTTCuu = ttCuuTemp.AddMinutes(timeNext);
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(timeTTCuu, (DateTime)tt.ttCuu, (DateTime)tt.ttGiacHoi);
								if (!"".Equals(tt.ttCham)) tt.ttCham = updateTimeTT(timeTTCuu, (DateTime)tt.ttCuu, (DateTime)tt.ttCham);
								if (!"".Equals(tt.ttMangCham)) tt.ttMangCham = updateTimeTT(timeTTCuu, (DateTime)tt.ttCuu, (DateTime)tt.ttMangCham);
								if (!"".Equals(tt.ttXung)) tt.ttXung = updateTimeTT(timeTTCuu, (DateTime)tt.ttCuu, (DateTime)tt.ttXung);
								if (!"".Equals(tt.ttHongNgoai)) tt.ttHongNgoai = updateTimeTT(timeTTCuu, (DateTime)tt.ttCuu, (DateTime)tt.ttHongNgoai);
								if (!"".Equals(tt.ttRongRoc)) tt.ttRongRoc = updateTimeTT(timeTTCuu, (DateTime)tt.ttCuu, (DateTime)tt.ttRongRoc);
								if (!"".Equals(tt.ttParafin)) tt.ttParafin = updateTimeTT(timeTTCuu, (DateTime)tt.ttCuu, (DateTime)tt.ttParafin);
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(timeTTCuu, (DateTime)tt.ttCuu, (DateTime)tt.ttCay);

								tt.ttCuu = timeTTCuu;
								tt.Cuu = timeTTCuu.ToString("HH:mm");
							}
						}
					LoopEndCuu:
						logs.Add(tt.Name + "\t\t\t" + "Cuu-OK");

					}

					// Giác hơi
					if (!"".Equals(tt.ttGiacHoi))
					{
						// dòng
						for (int i = 0; i < arrBS.GetLength(0); i++)
						{
							DateTime ttGiacHoiTemp = (DateTime)tt.ttGiacHoi;

							// Check làm đủ tới trưa không, nếu không chuyển qua đầu giờ chiều
							if ((DateTime.Compare(dateMorningEnd, ttGiacHoiTemp) > 0 && DateTime.Compare(dateMorningEnd, ttGiacHoiTemp.AddMinutes(timeGiacHoi)) < 0) ||
								(DateTime.Compare(dateMorningEnd, ttGiacHoiTemp) <= 0 && DateTime.Compare(datAfternoonStart, ttGiacHoiTemp) > 0))
							{
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(datAfternoonStart, (DateTime)tt.ttGiacHoi, (DateTime)tt.ttGiacHoi);
								if (!"".Equals(tt.ttCham)) tt.ttCham = updateTimeTT(datAfternoonStart, (DateTime)tt.ttGiacHoi, (DateTime)tt.ttCham);
								if (!"".Equals(tt.ttMangCham)) tt.ttMangCham = updateTimeTT(datAfternoonStart, (DateTime)tt.ttGiacHoi, (DateTime)tt.ttMangCham);
								if (!"".Equals(tt.ttXung)) tt.ttXung = updateTimeTT(datAfternoonStart, (DateTime)tt.ttGiacHoi, (DateTime)tt.ttXung);
								if (!"".Equals(tt.ttHongNgoai)) tt.ttHongNgoai = updateTimeTT(datAfternoonStart, (DateTime)tt.ttGiacHoi, (DateTime)tt.ttHongNgoai);
								if (!"".Equals(tt.ttRongRoc)) tt.ttRongRoc = updateTimeTT(datAfternoonStart, (DateTime)tt.ttGiacHoi, (DateTime)tt.ttRongRoc);
								if (!"".Equals(tt.ttParafin)) tt.ttParafin = updateTimeTT(datAfternoonStart, (DateTime)tt.ttGiacHoi, (DateTime)tt.ttParafin);
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttGiacHoi, (DateTime)tt.ttCay);

								tt.ttGiacHoi = datAfternoonStart;
								tt.GiacHoi = datAfternoonStart.ToString("HH:mm");
								continue;
							}
							else
							{
								ttGiacHoiTemp = (DateTime)tt.ttGiacHoi;
							}

							// Check làm đủ tới tối không, nếu không sẽ log -> có thể tối ưu bước này
							if (DateTime.Compare(datAfternoonEnd, ttGiacHoiTemp.AddMinutes(timeGiacHoi)) < 0)
							{
								Console.WriteLine("\nThủ thuật này ko đủ giờ làm");
								tt.GiacHoi = "x";
								goto LoopEndGiacHoi;
							}
							else
							{
								ttGiacHoiTemp = (DateTime)tt.ttGiacHoi;
							}

							if (DateTime.Compare(dateTimes[i], ttGiacHoiTemp) == 0)
							{
								// cột
								for (int j = 0; j < arrBS.GetLength(1); j++)
								{
									if (!BSs[j].ThuThuat.Contains("GIACHOI"))
									{
										continue;
									}

									if (arrBS[i, j] == null)
									{
										// Check xem trước & sau đó có xoa / cứu / giác hơi / ròng rọc / xung ko
										bool isXoaTay = false;
										bool isXoaMay = false;
										bool isCuu = false;
										bool isGiacHoi = false;
										bool isRongRoc = false;
										bool isXung = false;
										int tempKXoaTay = i - 10 <= 0 ? 0 : i - 10;
										int tempKXoaMay = i - 7 <= 0 ? 0 : i - 7;
										int tempKCuu = i - 7 <= 0 ? 0 : i - 7;
										int tempKRongRoc = i - 7 <= 0 ? 0 : i - 7;
										int tempKXung = i - 7 <= 0 ? 0 : i - 7;
										int tempKGiacHoi = i - 4 <= 0 ? 0 : i - 4;
										int tempIGiacHoi = i + 4 >= arrBS.GetLength(0) ? arrBS.GetLength(0) - 1 : i + 4;

										for (int k = tempKXoaTay; k < i; k++)
										{
											if (arrBS[k, j] != null && arrBS[k, j] != "x")
											{
												if (arrBS[k, j].Contains("-Xoa Tay"))
												{
													isXoaTay = true;
													break;
												}
												else if ((k >= tempKXoaMay) && arrBS[k, j].Contains("-Xoa Máy"))
												{
													isXoaMay = true;
													break;
												}
												else if ((k >= tempKCuu) && arrBS[k, j].Contains("-Cứu"))
												{
													isCuu = true;
													break;
												}
												else if ((k >= tempKRongRoc) && arrBS[k, j].Contains("-Ròng Rọc"))
												{
													isRongRoc = true;
													break;
												}
												else if ((k >= tempKGiacHoi) && arrBS[k, j].Contains("-Giác Hơi"))
												{
													isGiacHoi = true;
													break;
												}
											}
										}
										for (int k = i; k <= tempIGiacHoi; k++)
										{
											if (arrBS[k, j] != null && arrBS[k, j] != "x")
											{
												isGiacHoi = true;
												break;
											}
										}
										if (isXoaTay || isXoaMay || isXung || isCuu || isRongRoc || isGiacHoi)
										{
											continue;
										}

										arrBS[i, j] = tt.Code + "-Giác Hơi";
										DateTime timeTemp = (DateTime)tt.ttGiacHoi;
										tt.GiacHoi = timeTemp.ToString("HH:mm") + "-" + arrNameBS[0, j];
										goto LoopEndGiacHoi;
									}
								}

								// Full -> thêm giờ kế tiếp
								DateTime timeTTGiacHoi = ttGiacHoiTemp.AddMinutes(timeNext);
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(timeTTGiacHoi, (DateTime)tt.ttGiacHoi, (DateTime)tt.ttGiacHoi);
								if (!"".Equals(tt.ttCham)) tt.ttCham = updateTimeTT(timeTTGiacHoi, (DateTime)tt.ttGiacHoi, (DateTime)tt.ttCham);
								if (!"".Equals(tt.ttMangCham)) tt.ttMangCham = updateTimeTT(timeTTGiacHoi, (DateTime)tt.ttGiacHoi, (DateTime)tt.ttMangCham);
								if (!"".Equals(tt.ttXung)) tt.ttXung = updateTimeTT(timeTTGiacHoi, (DateTime)tt.ttGiacHoi, (DateTime)tt.ttXung);
								if (!"".Equals(tt.ttHongNgoai)) tt.ttHongNgoai = updateTimeTT(timeTTGiacHoi, (DateTime)tt.ttGiacHoi, (DateTime)tt.ttHongNgoai);
								if (!"".Equals(tt.ttRongRoc)) tt.ttRongRoc = updateTimeTT(timeTTGiacHoi, (DateTime)tt.ttGiacHoi, (DateTime)tt.ttRongRoc);
								if (!"".Equals(tt.ttParafin)) tt.ttParafin = updateTimeTT(timeTTGiacHoi, (DateTime)tt.ttGiacHoi, (DateTime)tt.ttParafin);
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(timeTTGiacHoi, (DateTime)tt.ttGiacHoi, (DateTime)tt.ttCay);

								tt.ttGiacHoi = timeTTGiacHoi;
								tt.GiacHoi = timeTTGiacHoi.ToString("HH:mm");
							}
						}
					LoopEndGiacHoi:
						logs.Add(tt.Name + "\t\t\t" + "GiacHoi-OK");

					}

					// Châm
					if (!"".Equals(tt.ttCham))
					{
						// dòng
						for (int i = 0; i < arrBS.GetLength(0); i++)
						{
							DateTime ttChamTemp = (DateTime)tt.ttCham;
							// Check làm đủ tới trưa không, nếu không chuyển qua đầu giờ chiều
							if ((DateTime.Compare(dateMorningEnd, ttChamTemp) > 0 && DateTime.Compare(dateMorningEnd, ttChamTemp.AddMinutes(timeCham)) < 0) ||
								(DateTime.Compare(dateMorningEnd, ttChamTemp) <= 0 && DateTime.Compare(datAfternoonStart, ttChamTemp) > 0))
							{
								if (!"".Equals(tt.ttMangCham)) tt.ttMangCham = updateTimeTT(datAfternoonStart, (DateTime)tt.ttCham, (DateTime)tt.ttMangCham);
								if (!"".Equals(tt.ttXung)) tt.ttXung = updateTimeTT(datAfternoonStart, (DateTime)tt.ttCham, (DateTime)tt.ttXung);
								if (!"".Equals(tt.ttHongNgoai)) tt.ttHongNgoai = updateTimeTT(datAfternoonStart, (DateTime)tt.ttCham, (DateTime)tt.ttHongNgoai);
								if (!"".Equals(tt.ttRongRoc)) tt.ttRongRoc = updateTimeTT(datAfternoonStart, (DateTime)tt.ttCham, (DateTime)tt.ttRongRoc);
								if (!"".Equals(tt.ttParafin)) tt.ttParafin = updateTimeTT(datAfternoonStart, (DateTime)tt.ttCham, (DateTime)tt.ttParafin);
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttCham, (DateTime)tt.ttCay);

								tt.ttCham = datAfternoonStart;
								tt.Cham = datAfternoonStart.ToString("HH:mm");
								continue;
							}
							else
							{
								ttChamTemp = (DateTime)tt.ttCham;
							}

							// Check làm đủ tới tối không, nếu không sẽ log -> có thể tối ưu bước này
							if (DateTime.Compare(datAfternoonEnd, ttChamTemp.AddMinutes(timeCham)) < 0)
							{
								Console.WriteLine("\nThủ thuật này ko đủ giờ làm");
								tt.Cham = "x";
								goto LoopEndCham;
							}
							else
							{
								ttChamTemp = (DateTime)tt.ttCham;
							}

							if (DateTime.Compare(dateTimes[i], ttChamTemp) == 0)
							{
								// cột
								for (int j = 0; j < arrBS.GetLength(1); j++)
								{
									if (!BSs[j].ThuThuat.Contains("CHAM"))
									{
										continue;
									}

									if (arrBS[i, j] == null)
									{
										// Check xem trước đó có xoa / cứu / giác hơi / ròng rọc / xung ko
										bool isXoaTay = false;
										bool isXoaMay = false;
										bool isCuu = false;
										bool isGiacHoi = false;
										bool isRongRoc = false;
										bool isXung = false;
										int tempKXoaTay = i - 10 <= 0 ? 0 : i - 10;
										int tempKXoaMay = i - 7 <= 0 ? 0 : i - 7;
										int tempKCuu = i - 7 <= 0 ? 0 : i - 7;
										int tempKRongRoc = i - 7 <= 0 ? 0 : i - 7;
										int tempKXung = i - 7 <= 0 ? 0 : i - 7;
										int tempKGiacHoi = i - 4 <= 0 ? 0 : i - 4;

										for (int k = tempKXoaTay; k < i; k++)
										{
											if (arrBS[k, j] != null)
											{
												if (arrBS[k, j].Contains("-Xoa Tay"))
												{
													isXoaTay = true;
													break;
												}
												else if ((k >= tempKXoaMay) && arrBS[k, j].Contains("-Xoa Máy"))
												{
													isXoaMay = true;
													break;
												}
												else if ((k >= tempKCuu) && arrBS[k, j].Contains("-Cứu"))
												{
													isCuu = true;
													break;
												}
												else if ((k >= tempKRongRoc) && arrBS[k, j].Contains("-Ròng Rọc"))
												{
													isRongRoc = true;
													break;
												}
												else if ((k >= tempKGiacHoi) && arrBS[k, j].Contains("-Giác Hơi"))
												{
													isGiacHoi = true;
													break;
												}
											}
										}
										if (isXoaTay || isXoaMay || isXung || isCuu || isRongRoc || isGiacHoi)
										{
											continue;
										}

										arrBS[i, j] = tt.Code + "-Châm";
										DateTime timeTemp = (DateTime)tt.ttCham;
										tt.Cham = timeTemp.ToString("HH:mm") + "-" + arrNameBS[0, j];
										goto LoopEndCham;
									}
								}

								// Full -> thêm giờ kế tiếp
								DateTime timeTTCham = ttChamTemp.AddMinutes(timeNext);
								if (!"".Equals(tt.ttMangCham)) tt.ttMangCham = updateTimeTT(timeTTCham, (DateTime)tt.ttCham, (DateTime)tt.ttMangCham);
								if (!"".Equals(tt.ttXung)) tt.ttXung = updateTimeTT(timeTTCham, (DateTime)tt.ttCham, (DateTime)tt.ttXung);
								if (!"".Equals(tt.ttHongNgoai)) tt.ttHongNgoai = updateTimeTT(timeTTCham, (DateTime)tt.ttCham, (DateTime)tt.ttHongNgoai);
								if (!"".Equals(tt.ttRongRoc)) tt.ttRongRoc = updateTimeTT(timeTTCham, (DateTime)tt.ttCham, (DateTime)tt.ttRongRoc);
								if (!"".Equals(tt.ttParafin)) tt.ttParafin = updateTimeTT(timeTTCham, (DateTime)tt.ttCham, (DateTime)tt.ttParafin);
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(timeTTCham, (DateTime)tt.ttCham, (DateTime)tt.ttCay);

								tt.ttCham = timeTTCham;
								tt.Cham = timeTTCham.ToString("HH:mm");
							}
						}
						LoopEndCham:
						// Update lại time tất cả thủ thuật
						logs.Add(tt.Name + "\t\t\t" + "Châm-OK");

					}

					// Mãng Châm
					if (!"".Equals(tt.ttMangCham))
					{
						// dòng
						for (int i = 0; i < arrBS.GetLength(0); i++)
						{
							DateTime ttMangChamTemp = (DateTime)tt.ttMangCham;
							// Check làm đủ tới trưa không, nếu không chuyển qua đầu giờ chiều
							if ((DateTime.Compare(dateMorningEnd, ttMangChamTemp) > 0 && DateTime.Compare(dateMorningEnd, ttMangChamTemp.AddMinutes(timeMangCham)) < 0) ||
								(DateTime.Compare(dateMorningEnd, ttMangChamTemp) <= 0 && DateTime.Compare(datAfternoonStart, ttMangChamTemp) > 0))
							{
								if (!"".Equals(tt.ttXung)) tt.ttXung = updateTimeTT(datAfternoonStart, (DateTime)tt.ttMangCham, (DateTime)tt.ttXung);
								if (!"".Equals(tt.ttHongNgoai)) tt.ttHongNgoai = updateTimeTT(datAfternoonStart, (DateTime)tt.ttMangCham, (DateTime)tt.ttHongNgoai);
								if (!"".Equals(tt.ttRongRoc)) tt.ttRongRoc = updateTimeTT(datAfternoonStart, (DateTime)tt.ttMangCham, (DateTime)tt.ttRongRoc);
								if (!"".Equals(tt.ttParafin)) tt.ttParafin = updateTimeTT(datAfternoonStart, (DateTime)tt.ttMangCham, (DateTime)tt.ttParafin);
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttMangCham, (DateTime)tt.ttCay);

								tt.ttMangCham = datAfternoonStart;
								tt.MangCham = datAfternoonStart.ToString("HH:mm");
								continue;
							}
							else
							{
								ttMangChamTemp = (DateTime)tt.ttMangCham;
							}

							// Check làm đủ tới tối không, nếu không sẽ log -> có thể tối ưu bước này
							if (DateTime.Compare(datAfternoonEnd, ttMangChamTemp.AddMinutes(timeMangCham)) < 0)
							{
								Console.WriteLine("\nThủ thuật này ko đủ giờ làm");
								tt.MangCham = "x";
								goto LoopEndMangCham;
							}
							else
							{
								ttMangChamTemp = (DateTime)tt.ttMangCham;
							}

							if (DateTime.Compare(dateTimes[i], ttMangChamTemp) == 0)
							{
								// cột
								for (int j = 0; j < arrBS.GetLength(1); j++)
								{
									if (!BSs[j].ThuThuat.Contains("MANGCHAM"))
									{
										continue;
									}


									if (arrBS[i, j] == null)
									{
										// Check xem trước đó có xoa / cứu / giác hơi / ròng rọc / xung ko
										bool isXoaTay = false;
										bool isXoaMay = false;
										bool isCuu = false;
										bool isGiacHoi = false;
										bool isRongRoc = false;
										bool isXung = false;
										int tempKXoaTay = i - 10 <= 0 ? 0 : i - 10;
										int tempKXoaMay = i - 7 <= 0 ? 0 : i - 7;
										int tempKCuu = i - 7 <= 0 ? 0 : i - 7;
										int tempKRongRoc = i - 7 <= 0 ? 0 : i - 7;
										int tempKXung = i - 7 <= 0 ? 0 : i - 7;
										int tempKGiacHoi = i - 4 <= 0 ? 0 : i - 4;

										for (int k = tempKXoaTay; k < i; k++)
										{
											if (arrBS[k, j] != null)
											{
												if (arrBS[k, j].Contains("-Xoa Tay"))
												{
													isXoaTay = true;
													break;
												}
												else if ((k >= tempKXoaMay) && arrBS[k, j].Contains("-Xoa Máy"))
												{
													isXoaMay = true;
													break;
												}
												else if ((k >= tempKCuu) && arrBS[k, j].Contains("-Cứu"))
												{
													isCuu = true;
													break;
												}
												else if ((k >= tempKRongRoc) && arrBS[k, j].Contains("-Ròng Rọc"))
												{
													isRongRoc = true;
													break;
												}
												else if ((k >= tempKGiacHoi) && arrBS[k, j].Contains("-Giác Hơi"))
												{
													isGiacHoi = true;
													break;
												}
											}
										}
										if (isXoaTay || isXoaMay || isXung || isCuu || isRongRoc || isGiacHoi)
										{
											continue;
										}

										arrBS[i, j] = tt.Code + "-Mãng Châm";
										DateTime timeTemp = (DateTime)tt.ttMangCham;
										tt.MangCham = timeTemp.ToString("HH:mm") + "-" + arrNameBS[0, j];
										goto LoopEndMangCham;
									}
								}

								// Full -> thêm giờ kế tiếp
								DateTime timeTTMangCham = ttMangChamTemp.AddMinutes(timeNext);
								if (!"".Equals(tt.ttXung)) tt.ttXung = updateTimeTT(timeTTMangCham, (DateTime)tt.ttMangCham, (DateTime)tt.ttXung);
								if (!"".Equals(tt.ttHongNgoai)) tt.ttHongNgoai = updateTimeTT(timeTTMangCham, (DateTime)tt.ttMangCham, (DateTime)tt.ttHongNgoai);
								if (!"".Equals(tt.ttRongRoc)) tt.ttRongRoc = updateTimeTT(timeTTMangCham, (DateTime)tt.ttMangCham, (DateTime)tt.ttRongRoc);
								if (!"".Equals(tt.ttParafin)) tt.ttParafin = updateTimeTT(timeTTMangCham, (DateTime)tt.ttMangCham, (DateTime)tt.ttParafin);
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(timeTTMangCham, (DateTime)tt.ttMangCham, (DateTime)tt.ttCay);

								tt.ttMangCham = timeTTMangCham;
								tt.MangCham = timeTTMangCham.ToString("HH:mm");
							}
						}
					LoopEndMangCham:
						// Update lại time tất cả thủ thuật
						logs.Add(tt.Name + "\t\t\t" + "Mãng Châm-OK");

					}

					// Xung
					if (!"".Equals(tt.ttXung))
					{
						// dòng
						for (int i = 0; i < arrBS.GetLength(0); i++)
						{
							DateTime ttXungTemp = (DateTime)tt.ttXung;

							// Check làm đủ tới trưa không, nếu không chuyển qua đầu giờ chiều
							if ((DateTime.Compare(dateMorningEnd, ttXungTemp) > 0 && DateTime.Compare(dateMorningEnd, ttXungTemp.AddMinutes(timeXung)) < 0) ||
								(DateTime.Compare(dateMorningEnd, ttXungTemp) <= 0 && DateTime.Compare(datAfternoonStart, ttXungTemp) > 0))
							{
								if (!"".Equals(tt.ttHongNgoai)) tt.ttHongNgoai = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXung, (DateTime)tt.ttHongNgoai);
								if (!"".Equals(tt.ttRongRoc)) tt.ttRongRoc = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXung, (DateTime)tt.ttRongRoc);
								if (!"".Equals(tt.ttParafin)) tt.ttParafin = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXung, (DateTime)tt.ttParafin);
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXung, (DateTime)tt.ttCay);

								tt.ttXung = datAfternoonStart;
								tt.Xung = datAfternoonStart.ToString("HH:mm");
								continue;
							}
							else
							{
								ttXungTemp = (DateTime)tt.ttXung;
							}

							// Check làm đủ tới tối không, nếu không sẽ log -> có thể tối ưu bước này
							if (DateTime.Compare(datAfternoonEnd, ttXungTemp.AddMinutes(timeXung)) < 0)
							{
								Console.WriteLine("\nThủ thuật này ko đủ giờ làm");
								tt.Xung = "x";
								goto LoopEndXung;
							}
							else
							{
								ttXungTemp = (DateTime)tt.ttXung;
							}

							if (DateTime.Compare(dateTimes[i], ttXungTemp) == 0)
							{
								int tempX = i - 7 < 0 ? 0 : i - 7;
								int tempY = i + 7 >= arrBS.GetLength(0) ? arrBS.GetLength(0) - 1 : i + 7;
								List<int> countDevice = new List<int>();
								for (int k = tempX; k <= tempY; k++)
								{
									int countTemp = 0;
									for (int j = 0; j < arrBS.GetLength(1); j++)
									{
										if (arrBS[k, j] != null && arrBS[k, j] != "x" && arrBS[k, j].Contains("Xung"))
										{
											countTemp++;
										}
									}
									countDevice.Add(countTemp);
								}

								if (tempX == 0 || tempY == arrBS.GetLength(0) - 1)
								{
									int total = countDevice.Sum();
									if (total >= countXung)
									{
										goto LoopGotoNext;
									}
								}
								else
								{
									List<int> listCount = new List<int>();
									for (int idx = 0; idx < countDevice.Count; idx++)
									{
										if (idx + 7 < countDevice.Count)
										{
											int x = countDevice[idx] + countDevice[idx + 1] + countDevice[idx + 2] + countDevice[idx + 3] + countDevice[idx + 4] + countDevice[idx + 5] + countDevice[idx + 6];
											listCount.Add(x);
										}

									}
									foreach (int x in listCount)
									{
										if (x >= countXung)
										{
											goto LoopGotoNext;
										}
									}
								}

								// cột
								for (int j = 0; j < arrBS.GetLength(1); j++)
								{
									if (!BSs[j].ThuThuat.Contains("XUNG"))
									{
										continue;
									}


									if (arrBS[i, j] == null)
									{
										// Check xem trước đó có xoa / cứu / giác hơi / ròng rọc / xung ko
										bool isXoaTay = false;
										bool isXoaMay = false;
										bool isCuu = false;
										bool isGiacHoi = false;
										bool isRongRoc = false;
										bool isXung = false;
										int tempKXoaTay = i - 10 <= 0 ? 0 : i - 10;
										int tempKXoaMay = i - 7 <= 0 ? 0 : i - 7;
										int tempKCuu = i - 7 <= 0 ? 0 : i - 7;
										int tempKRongRoc = i - 7 <= 0 ? 0 : i - 7;
										int tempKXung = i - 7 <= 0 ? 0 : i - 7;
										int tempKGiacHoi = i - 4 <= 0 ? 0 : i - 4;
										int tempIXung = i + 7 >= arrBS.GetLength(0) ? arrBS.GetLength(0) - 1 : i + 7;

										for (int k = tempKXoaTay; k < i; k++)
										{
											if (arrBS[k, j] != null && arrBS[k, j] != "x")
											{
												if (arrBS[k, j].Contains("-Xoa Tay"))
												{
													isXoaTay = true;
													break;
												}
												else if ((k >= tempKXoaMay) && arrBS[k, j].Contains("-Xoa Máy"))
												{
													isXoaMay = true;
													break;
												}
												else if ((k >= tempKCuu) && arrBS[k, j].Contains("-Cứu"))
												{
													isCuu = true;
													break;
												}
												else if ((k >= tempKRongRoc) && arrBS[k, j].Contains("-Ròng Rọc"))
												{
													isRongRoc = true;
													break;
												}
												else if ((k >= tempKGiacHoi) && arrBS[k, j].Contains("-Giác Hơi"))
												{
													isGiacHoi = true;
													break;
												}
											}
										}
										for (int k = i; k <= tempIXung; k++)
										{
											if (arrBS[k, j] != null && arrBS[k, j] != "x")
											{
												isXung = true;
												break;
											}
										}
										if (isXoaTay || isXoaMay || isXung || isCuu || isRongRoc || isGiacHoi)
										{
											continue;
										}

										arrBS[i, j] = tt.Code + "-Xung";
										DateTime timeTemp = (DateTime)tt.ttXung;
										tt.Xung = timeTemp.ToString("HH:mm") + "-" + arrNameBS[0, j]; ;
										goto LoopEndXung;
									}
								}

								LoopGotoNext:
								// Full -> thêm giờ kế tiếp
								DateTime timeTTXung = ttXungTemp.AddMinutes(timeNext);
								if (!"".Equals(tt.ttHongNgoai)) tt.ttHongNgoai = updateTimeTT(timeTTXung, (DateTime)tt.ttXung, (DateTime)tt.ttHongNgoai);
								if (!"".Equals(tt.ttRongRoc)) tt.ttRongRoc = updateTimeTT(timeTTXung, (DateTime)tt.ttXung, (DateTime)tt.ttRongRoc);
								if (!"".Equals(tt.ttParafin)) tt.ttParafin = updateTimeTT(timeTTXung, (DateTime)tt.ttXung, (DateTime)tt.ttParafin);
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(timeTTXung, (DateTime)tt.ttXung, (DateTime)tt.ttCay);

								tt.ttXung = timeTTXung;
								tt.Xung = timeTTXung.ToString("HH:mm");
							}
						}
						LoopEndXung:
						logs.Add(tt.Name + "\t\t\t" + "Xung-OK");

					}

					// Hồng ngoại
					if (!"".Equals(tt.ttHongNgoai))
					{
						// dòng
						for (int i = 0; i < arrBS.GetLength(0); i++)
						{
							DateTime ttHongNgoaiTemp = (DateTime)tt.ttHongNgoai;
							// Check làm đủ tới trưa không, nếu không chuyển qua đầu giờ chiều
							if ((DateTime.Compare(dateMorningEnd, ttHongNgoaiTemp) > 0 && DateTime.Compare(dateMorningEnd, ttHongNgoaiTemp.AddMinutes(timeHongNgoai)) < 0) ||
								(DateTime.Compare(dateMorningEnd, ttHongNgoaiTemp) <= 0 && DateTime.Compare(datAfternoonStart, ttHongNgoaiTemp) > 0))
							{
								if (!"".Equals(tt.ttXung)) tt.ttXung = updateTimeTT(datAfternoonStart, (DateTime)tt.ttHongNgoai, (DateTime)tt.ttXung);
								if (!"".Equals(tt.ttHongNgoai)) tt.ttHongNgoai = updateTimeTT(datAfternoonStart, (DateTime)tt.ttHongNgoai, (DateTime)tt.ttHongNgoai);
								if (!"".Equals(tt.ttRongRoc)) tt.ttRongRoc = updateTimeTT(datAfternoonStart, (DateTime)tt.ttHongNgoai, (DateTime)tt.ttRongRoc);
								if (!"".Equals(tt.ttParafin)) tt.ttParafin = updateTimeTT(datAfternoonStart, (DateTime)tt.ttHongNgoai, (DateTime)tt.ttParafin);
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttHongNgoai, (DateTime)tt.ttCay);

								tt.ttHongNgoai = datAfternoonStart;
								tt.HongNgoai = datAfternoonStart.ToString("HH:mm");
								continue;
							}
							else
							{
								ttHongNgoaiTemp = (DateTime)tt.ttHongNgoai;
							}

							// Check làm đủ tới tối không, nếu không sẽ log -> có thể tối ưu bước này
							if (DateTime.Compare(datAfternoonEnd, ttHongNgoaiTemp.AddMinutes(timeHongNgoai)) < 0)
							{
								Console.WriteLine("\nThủ thuật này ko đủ giờ làm");
								tt.HongNgoai = "x";
								goto LoopEndHongNgoai;
							}
							else
							{
								ttHongNgoaiTemp = (DateTime)tt.ttHongNgoai;
							}

							if (DateTime.Compare(dateTimes[i], ttHongNgoaiTemp) == 0)
							{
								// cột
								for (int j = 0; j < arrBS.GetLength(1); j++)
								{
									if (!BSs[j].ThuThuat.Contains("HONGNGOAI"))
									{
										continue;
									}


									if (arrBS[i, j] == null)
									{
										// Check xem trước đó có xoa / cứu / giác hơi / ròng rọc / xung ko
										bool isXoaTay = false;
										bool isXoaMay = false;
										bool isCuu = false;
										bool isGiacHoi = false;
										bool isRongRoc = false;
										bool isXung = false;
										int tempKXoaTay = i - 10 <= 0 ? 0 : i - 10;
										int tempKXoaMay = i - 7 <= 0 ? 0 : i - 7;
										int tempKCuu = i - 7 <= 0 ? 0 : i - 7;
										int tempKRongRoc = i - 7 <= 0 ? 0 : i - 7;
										int tempKXung = i - 7 <= 0 ? 0 : i - 7;
										int tempKGiacHoi = i - 4 <= 0 ? 0 : i - 4;

										for (int k = tempKXoaTay; k < i; k++)
										{
											if (arrBS[k, j] != null)
											{
												if (arrBS[k, j].Contains("-Xoa Tay"))
												{
													isXoaTay = true;
													break;
												}
												else if ((k >= tempKXoaMay) && arrBS[k, j].Contains("-Xoa Máy"))
												{
													isXoaMay = true;
													break;
												}
												else if ((k >= tempKCuu) && arrBS[k, j].Contains("-Cứu"))
												{
													isCuu = true;
													break;
												}
												else if ((k >= tempKRongRoc) && arrBS[k, j].Contains("-Ròng Rọc"))
												{
													isRongRoc = true;
													break;
												}
												else if ((k >= tempKGiacHoi) && arrBS[k, j].Contains("-Giác Hơi"))
												{
													isGiacHoi = true;
													break;
												}
											}
										}
										if (isXoaTay || isXoaMay || isXung || isCuu || isRongRoc || isGiacHoi)
										{
											continue;
										}

										arrBS[i, j] = tt.Code + "-Hồng Ngoại";
										DateTime timeTemp = (DateTime)tt.ttHongNgoai;
										tt.HongNgoai = timeTemp.ToString("HH:mm") + "-" + arrNameBS[0, j];
										goto LoopEndHongNgoai;
									}
								}

								// Full -> thêm giờ kế tiếp
								DateTime timeTTHongNgoai = ttHongNgoaiTemp.AddMinutes(timeNext);
								if (!"".Equals(tt.ttRongRoc)) tt.ttRongRoc = updateTimeTT(timeTTHongNgoai, (DateTime)tt.ttHongNgoai, (DateTime)tt.ttRongRoc);
								if (!"".Equals(tt.ttParafin)) tt.ttParafin = updateTimeTT(timeTTHongNgoai, (DateTime)tt.ttHongNgoai, (DateTime)tt.ttParafin);
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(timeTTHongNgoai, (DateTime)tt.ttHongNgoai, (DateTime)tt.ttCay);

								tt.ttHongNgoai = timeTTHongNgoai;
								tt.HongNgoai = timeTTHongNgoai.ToString("HH:mm");
							}
						}
					LoopEndHongNgoai:
						// Update lại time tất cả thủ thuật
						logs.Add(tt.Name + "\t\t\t" + "Hồng Ngoại-OK");

					}

					// Ròng rọc
					if (!"".Equals(tt.ttRongRoc))
					{
						// dòng
						for (int i = 0; i < arrBS.GetLength(0); i++)
						{
							DateTime ttRongRocTemp = (DateTime)tt.ttRongRoc;
							// Check làm đủ tới trưa không, nếu không chuyển qua đầu giờ chiều
							if ((DateTime.Compare(dateMorningEnd, ttRongRocTemp) > 0 && DateTime.Compare(dateMorningEnd, ttRongRocTemp.AddMinutes(timeRongRoc)) < 0) ||
								(DateTime.Compare(dateMorningEnd, ttRongRocTemp) <= 0 && DateTime.Compare(datAfternoonStart, ttRongRocTemp) > 0))
							{
								if (!"".Equals(tt.ttParafin)) tt.ttParafin = updateTimeTT(datAfternoonStart, (DateTime)tt.ttRongRoc, (DateTime)tt.ttParafin);
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttRongRoc, (DateTime)tt.ttCay);

								tt.ttRongRoc = datAfternoonStart;
								tt.RongRoc = datAfternoonStart.ToString("HH:mm");
								continue;
							}
							else
							{
								ttRongRocTemp = (DateTime)tt.ttRongRoc;
							}

							// Check làm đủ tới tối không, nếu không sẽ log -> có thể tối ưu bước này
							if (DateTime.Compare(datAfternoonEnd, ttRongRocTemp.AddMinutes(timeRongRoc)) < 0)
							{
								Console.WriteLine("\nThủ thuật này ko đủ giờ làm");
								tt.RongRoc = "x";
								goto LoopEndRongRoc;
							}
							else
							{
								ttRongRocTemp = (DateTime)tt.ttRongRoc;
							}

							if (DateTime.Compare(dateTimes[i], ttRongRocTemp) == 0)
							{
								// cột
								for (int j = 0; j < arrBS.GetLength(1); j++)
								{
									if (!BSs[j].ThuThuat.Contains("RONGROC"))
									{
										continue;
									}


									if (arrBS[i, j] == null)
									{
										// Check xem trước đó có xoa / cứu / giác hơi / ròng rọc / xung ko
										bool isXoaTay = false;
										bool isXoaMay = false;
										bool isCuu = false;
										bool isGiacHoi = false;
										bool isRongRoc = false;
										bool isXung = false;
										int tempKXoaTay = i - 10 <= 0 ? 0 : i - 10;
										int tempKXoaMay = i - 7 <= 0 ? 0 : i - 7;
										int tempKCuu = i - 7 <= 0 ? 0 : i - 7;
										int tempKRongRoc = i - 7 <= 0 ? 0 : i - 7;
										int tempKXung = i - 7 <= 0 ? 0 : i - 7;
										int tempKGiacHoi = i - 4 <= 0 ? 0 : i - 4;
										int tempIRongRoc = i + 7 >= arrBS.GetLength(0) ? arrBS.GetLength(0) - 1 : i + 7;

										for (int k = tempKXoaTay; k < i; k++)
										{
											if (arrBS[k, j] != null && arrBS[k, j] != "x")
											{
												if (arrBS[k, j].Contains("-Xoa Tay"))
												{
													isXoaTay = true;
													break;
												}
												else if ((k >= tempKXoaMay) && arrBS[k, j].Contains("-Xoa Máy"))
												{
													isXoaMay = true;
													break;
												}
												else if ((k >= tempKCuu) && arrBS[k, j].Contains("-Cứu"))
												{
													isCuu = true;
													break;
												}
												else if ((k >= tempKRongRoc) && arrBS[k, j].Contains("-Ròng Rọc"))
												{
													isRongRoc = true;
													break;
												}
												else if ((k >= tempKGiacHoi) && arrBS[k, j].Contains("-Giác Hơi"))
												{
													isGiacHoi = true;
													break;
												}
											}
										}
										for (int k = i; k <= tempIRongRoc; k++)
										{
											if (arrBS[k, j] != null && arrBS[k, j] != "x")
											{
												isRongRoc = true;
												break;
											}
										}
										if (isXoaTay || isXoaMay || isXung || isCuu || isRongRoc || isGiacHoi)
										{
											continue;
										}

										arrBS[i, j] = tt.Code + "-Ròng Rọc";
										DateTime timeTemp = (DateTime)tt.ttRongRoc;
										tt.RongRoc = timeTemp.ToString("HH:mm") + "-" + arrNameBS[0, j];
										goto LoopEndRongRoc;
									}
								}

								// Full -> thêm giờ kế tiếp
								DateTime timeTTRongRoc = ttRongRocTemp.AddMinutes(timeNext);
								if (!"".Equals(tt.ttParafin)) tt.ttParafin = updateTimeTT(timeTTRongRoc, (DateTime)tt.ttRongRoc, (DateTime)tt.ttParafin);
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(timeTTRongRoc, (DateTime)tt.ttRongRoc, (DateTime)tt.ttCay);

								tt.ttRongRoc = timeTTRongRoc;
								tt.RongRoc = timeTTRongRoc.ToString("HH:mm");
							}
						}
					LoopEndRongRoc:
						// Update lại time tất cả thủ thuật
						logs.Add(tt.Name + "\t\t\t" + "Ròng Rọc-OK");

					}

					// Parafin
					if (!"".Equals(tt.ttParafin))
					{
						// dòng
						for (int i = 0; i < arrBS.GetLength(0); i++)
						{
							DateTime ttParafinTemp = (DateTime)tt.ttParafin;

							// Check làm đủ tới trưa không, nếu không chuyển qua đầu giờ chiều
							if ((DateTime.Compare(dateMorningEnd, ttParafinTemp) > 0 && DateTime.Compare(dateMorningEnd, ttParafinTemp.AddMinutes(timeParafin)) < 0) ||
								(DateTime.Compare(dateMorningEnd, ttParafinTemp) <= 0 && DateTime.Compare(datAfternoonStart, ttParafinTemp) > 0))
							{
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttParafin, (DateTime)tt.ttCay);

								tt.ttParafin = datAfternoonStart;
								tt.Parafin = datAfternoonStart.ToString("HH:mm");
								continue;
							}
							else
							{
								ttParafinTemp = (DateTime)tt.ttParafin;
							}

							// Check làm đủ tới tối không, nếu không sẽ log -> có thể tối ưu bước này
							if (DateTime.Compare(datAfternoonEnd, ttParafinTemp.AddMinutes(timeParafin)) < 0)
							{
								Console.WriteLine("\nThủ thuật này ko đủ giờ làm");
								tt.Parafin = "x";
								goto LoopEndParafin;
							}
							else
							{
								ttParafinTemp = (DateTime)tt.ttParafin;
							}

							if (DateTime.Compare(dateTimes[i], ttParafinTemp) == 0)
							{
								// cột
								for (int j = 0; j < arrBS.GetLength(1); j++)
								{
									if (!BSs[j].ThuThuat.Contains("PARAFIN"))
									{
										continue;
									}


									if (arrBS[i, j] == null)
									{

										// Check xem trước đó có xoa / cứu / giác hơi / ròng rọc / xung ko
										bool isXoaTay = false;
										bool isXoaMay = false;
										bool isCuu = false;
										bool isGiacHoi = false;
										bool isRongRoc = false;
										bool isXung = false;
										int tempKXoaTay = i - 10 <= 0 ? 0 : i - 10;
										int tempKXoaMay = i - 7 <= 0 ? 0 : i - 7;
										int tempKCuu = i - 7 <= 0 ? 0 : i - 7;
										int tempKRongRoc = i - 7 <= 0 ? 0 : i - 7;
										int tempKXung = i - 7 <= 0 ? 0 : i - 7;
										int tempKGiacHoi = i - 4 <= 0 ? 0 : i - 4;

										for (int k = tempKXoaTay; k < i; k++)
										{
											if (arrBS[k, j] != null)
											{
												if (arrBS[k, j].Contains("-Xoa Tay"))
												{
													isXoaTay = true;
													break;
												}
												else if ((k >= tempKXoaMay) && arrBS[k, j].Contains("-Xoa Máy"))
												{
													isXoaMay = true;
													break;
												}
												else if ((k >= tempKCuu) && arrBS[k, j].Contains("-Cứu"))
												{
													isCuu = true;
													break;
												}
												else if ((k >= tempKRongRoc) && arrBS[k, j].Contains("-Ròng Rọc"))
												{
													isRongRoc = true;
													break;
												}
												else if ((k >= tempKGiacHoi) && arrBS[k, j].Contains("-Giác Hơi"))
												{
													isGiacHoi = true;
													break;
												}
											}
										}
										if (isXoaTay || isXoaMay || isXung || isCuu || isRongRoc || isGiacHoi)
										{
											continue;
										}

										arrBS[i, j] = tt.Code + "-Parafin";
										DateTime timeTemp = (DateTime)tt.ttParafin;
										tt.Parafin = timeTemp.ToString("HH:mm") + "-" + arrNameBS[0, j];
										goto LoopEndParafin;
									}
								}

								// Full -> thêm giờ kế tiếp
								DateTime timeTTParafin = ttParafinTemp.AddMinutes(timeNext);
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(timeTTParafin, (DateTime)tt.ttParafin, (DateTime)tt.ttCay);

								tt.ttParafin = timeTTParafin;
								tt.Parafin = timeTTParafin.ToString("HH:mm");
							}
						}
						LoopEndParafin:
						logs.Add(tt.Name + "\t\t\t" + "Parafin-OK");

					}

					// Cấy
					if (!"".Equals(tt.ttCay))
					{
						// dòng
						for (int i = 0; i < arrBS.GetLength(0); i++)
						{
							DateTime ttCayTemp = (DateTime)tt.ttCay;

							// Check làm đủ tới trưa không, nếu không chuyển qua đầu giờ chiều
							if ((DateTime.Compare(dateMorningEnd, ttCayTemp) > 0 && DateTime.Compare(dateMorningEnd, ttCayTemp.AddMinutes(timeCay)) < 0) ||
								(DateTime.Compare(dateMorningEnd, ttCayTemp) <= 0 && DateTime.Compare(datAfternoonStart, ttCayTemp) > 0))
							{
								tt.ttCay = datAfternoonStart;
								tt.Cay = datAfternoonStart.ToString("HH:mm");
								continue;
							}
							else
							{
								ttCayTemp = (DateTime)tt.ttCay;
							}

							// Check làm đủ tới tối không, nếu không sẽ log -> có thể tối ưu bước này
							if (DateTime.Compare(datAfternoonEnd, ttCayTemp.AddMinutes(timeCay)) < 0)
							{
								Console.WriteLine("\nThủ thuật này ko đủ giờ làm");
								tt.Cay = "x";
								goto LoopEndCay;
							}
							else
							{
								ttCayTemp = (DateTime)tt.ttCay;
							}

							if (DateTime.Compare(dateTimes[i], ttCayTemp) == 0)
							{
								// cột
								for (int j = 0; j < arrBS.GetLength(1); j++)
								{
									if (!BSs[j].ThuThuat.Contains("CAY"))
									{
										continue;
									}

									if (arrBS[i, j] == null)
									{

										// Check xem trước đó có xoa / cứu / giác hơi / ròng rọc / xung ko
										bool isXoaTay = false;
										bool isXoaMay = false;
										bool isCuu = false;
										bool isGiacHoi = false;
										bool isRongRoc = false;
										bool isXung = false;
										int tempKXoaTay = i - 10 <= 0 ? 0 : i - 10;
										int tempKXoaMay = i - 7 <= 0 ? 0 : i - 7;
										int tempKCuu = i - 7 <= 0 ? 0 : i - 7;
										int tempKRongRoc = i - 7 <= 0 ? 0 : i - 7;
										int tempKXung = i - 7 <= 0 ? 0 : i - 7;
										int tempKGiacHoi = i - 4 <= 0 ? 0 : i - 4;

										for (int k = tempKXoaTay; k < i; k++)
										{
											if (arrBS[k, j] != null)
											{
												if (arrBS[k, j].Contains("-Xoa Tay"))
												{
													isXoaTay = true;
													break;
												}
												else if ((k >= tempKXoaMay) && arrBS[k, j].Contains("-Xoa Máy"))
												{
													isXoaMay = true;
													break;
												}
												else if ((k >= tempKCuu) && arrBS[k, j].Contains("-Cứu"))
												{
													isCuu = true;
													break;
												}
												else if ((k >= tempKRongRoc) && arrBS[k, j].Contains("-Ròng Rọc"))
												{
													isRongRoc = true;
													break;
												}
												else if ((k >= tempKGiacHoi) && arrBS[k, j].Contains("-Giác Hơi"))
												{
													isGiacHoi = true;
													break;
												}
											}
										}
										if (isXoaTay || isXoaMay || isXung || isCuu || isRongRoc || isGiacHoi)
										{
											continue;
										}

										arrBS[i, j] = tt.Code + "-Cấy";
										DateTime timeTemp = (DateTime)tt.ttCay;
										tt.Cay = timeTemp.ToString("HH:mm") + "-" + arrNameBS[0, j];
										goto LoopEndCay;
									}
								}

								// Full -> thêm giờ kế tiếp
								DateTime timeTTCay = ttCayTemp.AddMinutes(timeNext);
								tt.ttCay = timeTTCay;
								tt.Cay = timeTTCay.ToString("HH:mm");
							}
						}
						LoopEndCay:
						logs.Add(tt.Name + "\t\t\t" + "Cấy-OK");

					}

					bool IsSave = excelChiaTTDataService.ManageExcelTT(tt).Result;
				}
				logs.Add("---------End Chia thủ thuật - Ra viện sớm ----------");

				// Chia thủ thuật 
				logs.Add("");
				logs.Add("---------Start Chia thủ thuật - Khám bình thường ----------");
				foreach (TT tt in TTs)
				{
					logs.Add("");
					// Châm
					if (!"".Equals(tt.ttCham))
					{
						// dòng
						for (int i = 0; i < arrBS.GetLength(0); i++)
						{
							DateTime ttChamTemp = (DateTime)tt.ttCham;
							
							// Check làm đủ tới trưa không, nếu không chuyển qua đầu giờ chiều
							if ((DateTime.Compare(dateMorningEnd, ttChamTemp) > 0 && DateTime.Compare(dateMorningEnd, ttChamTemp.AddMinutes(timeCham)) < 0) ||
								(DateTime.Compare(dateMorningEnd, ttChamTemp) <= 0 && DateTime.Compare(datAfternoonStart, ttChamTemp) > 0))
							{
								if (!"".Equals(tt.ttMangCham)) tt.ttMangCham = updateTimeTT(datAfternoonStart, (DateTime)tt.ttCham, (DateTime)tt.ttMangCham);
								if (!"".Equals(tt.ttXung)) tt.ttXung = updateTimeTT(datAfternoonStart, (DateTime)tt.ttCham, (DateTime)tt.ttXung);
								if (!"".Equals(tt.ttHongNgoai)) tt.ttHongNgoai = updateTimeTT(datAfternoonStart, (DateTime)tt.ttCham, (DateTime)tt.ttHongNgoai);
								if (!"".Equals(tt.ttRongRoc)) tt.ttRongRoc = updateTimeTT(datAfternoonStart, (DateTime)tt.ttCham, (DateTime)tt.ttRongRoc);
								if (!"".Equals(tt.ttParafin)) tt.ttParafin = updateTimeTT(datAfternoonStart, (DateTime)tt.ttCham, (DateTime)tt.ttParafin);
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttCham, (DateTime)tt.ttCay);
								if (!"".Equals(tt.ttNgam)) tt.ttNgam = updateTimeTT(datAfternoonStart, (DateTime)tt.ttCham, (DateTime)tt.ttNgam);
								if (!"".Equals(tt.ttXong)) tt.ttXong = updateTimeTT(datAfternoonStart, (DateTime)tt.ttCham, (DateTime)tt.ttXong);
								if (!"".Equals(tt.ttBo)) tt.ttBo = updateTimeTT(datAfternoonStart, (DateTime)tt.ttCham, (DateTime)tt.ttBo);
								if (!"".Equals(tt.ttXoaMay)) tt.ttXoaMay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttCham, (DateTime)tt.ttXoaMay);
								if (!"".Equals(tt.ttXoaTay)) tt.ttXoaTay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttCham, (DateTime)tt.ttXoaTay);
								if (!"".Equals(tt.ttCuu)) tt.ttCuu = updateTimeTT(datAfternoonStart, (DateTime)tt.ttCham, (DateTime)tt.ttCuu);
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(datAfternoonStart, (DateTime)tt.ttCham, (DateTime)tt.ttGiacHoi);

								tt.ttCham = datAfternoonStart;
								tt.Cham = datAfternoonStart.ToString("HH:mm");
								continue;
							}
							else
							{
								ttChamTemp = (DateTime)tt.ttCham;
							} 
							
							// Check làm đủ tới tối không, nếu không sẽ log -> có thể tối ưu bước này
							if (DateTime.Compare(datAfternoonEnd, ttChamTemp.AddMinutes(timeCham)) < 0)
							{
								Console.WriteLine("\nThủ thuật này ko đủ giờ làm");
								tt.Cham = "x";
								goto LoopEndCham;
							}
							else
							{
								ttChamTemp = (DateTime)tt.ttCham;
							}	

							if (DateTime.Compare(dateTimes[i], ttChamTemp) == 0)
							{
								// cột
								for (int j = 0; j < arrBS.GetLength(1); j++)
								{
								

									if (!BSs[j].ThuThuat.Contains("CHAM"))
									{
										continue;
									}

									if (arrBS[i, j] == null)
									{

										/*int tempKXT = i - 8 <= 0 ? 0 : i - 8;
										int tempKXM = i - 5 <= 0 ? 0 : i - 5;*/
										// Check xem trước đó có xoa / cứu / giác hơi / ròng rọc / xung ko
										bool isXoaTay = false;
										bool isXoaMay = false;
										bool isCuu = false;
										bool isGiacHoi = false;
										bool isRongRoc = false;
										bool isXung = false;
										int tempKXoaTay = i - 10 <= 0 ? 0 : i - 10;
										int tempKXoaMay = i - 7 <= 0 ? 0 : i - 7;
										int tempKCuu = i - 7 <= 0 ? 0 : i - 7;
										int tempKRongRoc = i - 7 <= 0 ? 0 : i - 7;
										int tempKXung = i - 7 <= 0 ? 0 : i - 7;
										int tempKGiacHoi = i - 4 <= 0 ? 0 : i - 4;

										for (int k = tempKXoaTay; k < i; k++)
										{
											if (arrBS[k, j] != null)
											{
												if (arrBS[k, j].Contains("-Xoa Tay"))
												{
													isXoaTay = true;
													break;
												}
												else if ((k >= tempKXoaMay) && arrBS[k, j].Contains("-Xoa Máy"))
												{
													isXoaMay = true;
													break;
												}
												else if ((k >= tempKCuu) && arrBS[k, j].Contains("-Cứu"))
												{
													isCuu = true;
													break;
												}
												else if ((k >= tempKRongRoc) && arrBS[k, j].Contains("-Ròng Rọc"))
												{
													isRongRoc = true;
													break;
												}
												else if ((k >= tempKGiacHoi) && arrBS[k, j].Contains("-Giác Hơi"))
												{
													isGiacHoi = true;
													break;
												}
											}
										}
										if (isXoaTay || isXoaMay || isXung || isCuu || isRongRoc || isGiacHoi)
										{
											continue;
										}

										arrBS[i, j] = tt.Code + "-Châm";
										DateTime timeTemp = (DateTime)tt.ttCham;
										tt.Cham = timeTemp.ToString("HH:mm") + "-" + arrNameBS[0, j];
										goto LoopEndCham;
									}
								}

								// Full -> thêm giờ kế tiếp
								DateTime timeTTCham = ttChamTemp.AddMinutes(timeNext);

								if (!"".Equals(tt.ttMangCham)) tt.ttMangCham = updateTimeTT(timeTTCham, (DateTime)tt.ttCham, (DateTime)tt.ttMangCham);
								if (!"".Equals(tt.ttXung)) tt.ttXung = updateTimeTT(timeTTCham, (DateTime)tt.ttCham, (DateTime)tt.ttXung);
								if (!"".Equals(tt.ttHongNgoai)) tt.ttHongNgoai = updateTimeTT(timeTTCham, (DateTime)tt.ttCham, (DateTime)tt.ttHongNgoai);
								if (!"".Equals(tt.ttRongRoc)) tt.ttRongRoc = updateTimeTT(timeTTCham, (DateTime)tt.ttCham, (DateTime)tt.ttRongRoc);
								if (!"".Equals(tt.ttParafin)) tt.ttParafin = updateTimeTT(timeTTCham, (DateTime)tt.ttCham, (DateTime)tt.ttParafin);
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(timeTTCham, (DateTime)tt.ttCham, (DateTime)tt.ttCay);
								if (!"".Equals(tt.ttNgam)) tt.ttNgam = updateTimeTT(timeTTCham, (DateTime)tt.ttCham, (DateTime)tt.ttNgam);
								if (!"".Equals(tt.ttXong)) tt.ttXong = updateTimeTT(timeTTCham, (DateTime)tt.ttCham, (DateTime)tt.ttXong);
								if (!"".Equals(tt.ttBo)) tt.ttBo = updateTimeTT(timeTTCham, (DateTime)tt.ttCham, (DateTime)tt.ttBo);
								if (!"".Equals(tt.ttXoaMay)) tt.ttXoaMay = updateTimeTT(timeTTCham, (DateTime)tt.ttCham, (DateTime)tt.ttXoaMay);
								if (!"".Equals(tt.ttXoaTay)) tt.ttXoaTay = updateTimeTT(timeTTCham, (DateTime)tt.ttCham, (DateTime)tt.ttXoaTay);
								if (!"".Equals(tt.ttCuu)) tt.ttCuu = updateTimeTT(timeTTCham, (DateTime)tt.ttCham, (DateTime)tt.ttCuu);
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(timeTTCham, (DateTime)tt.ttCham, (DateTime)tt.ttGiacHoi);

								tt.ttCham = timeTTCham;
								tt.Cham = timeTTCham.ToString("HH:mm");
							}
						}
						LoopEndCham:
						// Update lại time tất cả thủ thuật
						logs.Add(tt.Name + "\t\t\t" + "Châm-OK");
					}

					// Mãng Châm
					if (!"".Equals(tt.ttMangCham))
					{
						// dòng
						for (int i = 0; i < arrBS.GetLength(0); i++)
						{
							DateTime ttMangChamTemp = (DateTime)tt.ttMangCham;
							// Check làm đủ tới trưa không, nếu không chuyển qua đầu giờ chiều
							if ((DateTime.Compare(dateMorningEnd, ttMangChamTemp) > 0 && DateTime.Compare(dateMorningEnd, ttMangChamTemp.AddMinutes(timeMangCham)) < 0) ||
								(DateTime.Compare(dateMorningEnd, ttMangChamTemp) <= 0 && DateTime.Compare(datAfternoonStart, ttMangChamTemp) > 0))
							{
								if (!"".Equals(tt.ttXung)) tt.ttXung = updateTimeTT(datAfternoonStart, (DateTime)tt.ttMangCham, (DateTime)tt.ttXung);
								if (!"".Equals(tt.ttHongNgoai)) tt.ttHongNgoai = updateTimeTT(datAfternoonStart, (DateTime)tt.ttMangCham, (DateTime)tt.ttHongNgoai);
								if (!"".Equals(tt.ttRongRoc)) tt.ttRongRoc = updateTimeTT(datAfternoonStart, (DateTime)tt.ttMangCham, (DateTime)tt.ttRongRoc);
								if (!"".Equals(tt.ttParafin)) tt.ttParafin = updateTimeTT(datAfternoonStart, (DateTime)tt.ttMangCham, (DateTime)tt.ttParafin);
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttMangCham, (DateTime)tt.ttCay);
								if (!"".Equals(tt.ttNgam)) tt.ttNgam = updateTimeTT(datAfternoonStart, (DateTime)tt.ttMangCham, (DateTime)tt.ttNgam);
								if (!"".Equals(tt.ttXong)) tt.ttXong = updateTimeTT(datAfternoonStart, (DateTime)tt.ttMangCham, (DateTime)tt.ttXong);
								if (!"".Equals(tt.ttBo)) tt.ttBo = updateTimeTT(datAfternoonStart, (DateTime)tt.ttMangCham, (DateTime)tt.ttBo);
								if (!"".Equals(tt.ttXoaMay)) tt.ttXoaMay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttMangCham, (DateTime)tt.ttXoaMay);
								if (!"".Equals(tt.ttXoaTay)) tt.ttXoaTay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttMangCham, (DateTime)tt.ttXoaTay);
								if (!"".Equals(tt.ttCuu)) tt.ttCuu = updateTimeTT(datAfternoonStart, (DateTime)tt.ttMangCham, (DateTime)tt.ttCuu);
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(datAfternoonStart, (DateTime)tt.ttMangCham, (DateTime)tt.ttGiacHoi);

								tt.ttMangCham = datAfternoonStart;
								tt.MangCham = datAfternoonStart.ToString("HH:mm");
								continue;
							}
							else
							{
								ttMangChamTemp = (DateTime)tt.ttMangCham;
							}

							// Check làm đủ tới tối không, nếu không sẽ log -> có thể tối ưu bước này
							if (DateTime.Compare(datAfternoonEnd, ttMangChamTemp.AddMinutes(timeMangCham)) < 0)
							{
								Console.WriteLine("\nThủ thuật này ko đủ giờ làm");
								tt.Cham = "x";
								goto LoopEndMangCham;
							}
							else
							{
								ttMangChamTemp = (DateTime)tt.ttMangCham;
							}

							if (DateTime.Compare(dateTimes[i], ttMangChamTemp) == 0)
							{
								// cột
								for (int j = 0; j < arrBS.GetLength(1); j++)
								{
									if (!BSs[j].ThuThuat.Contains("MANGCHAM"))
									{
										continue;
									}


									if (arrBS[i, j] == null)
									{
										// Check xem trước đó có xoa / cứu / giác hơi / ròng rọc / xung ko
										bool isXoaTay = false;
										bool isXoaMay = false;
										bool isCuu = false;
										bool isGiacHoi = false;
										bool isRongRoc = false;
										bool isXung = false;
										int tempKXoaTay = i - 10 <= 0 ? 0 : i - 10;
										int tempKXoaMay = i - 7 <= 0 ? 0 : i - 7;
										int tempKCuu = i - 7 <= 0 ? 0 : i - 7;
										int tempKRongRoc = i - 7 <= 0 ? 0 : i - 7;
										int tempKXung = i - 7 <= 0 ? 0 : i - 7;
										int tempKGiacHoi = i - 4 <= 0 ? 0 : i - 4;

										for (int k = tempKXoaTay; k < i; k++)
										{
											if (arrBS[k, j] != null)
											{
												if (arrBS[k, j].Contains("-Xoa Tay"))
												{
													isXoaTay = true;
													break;
												}
												else if ((k >= tempKXoaMay) && arrBS[k, j].Contains("-Xoa Máy"))
												{
													isXoaMay = true;
													break;
												}
												else if ((k >= tempKCuu) && arrBS[k, j].Contains("-Cứu"))
												{
													isCuu = true;
													break;
												}
												else if ((k >= tempKRongRoc) && arrBS[k, j].Contains("-Ròng Rọc"))
												{
													isRongRoc = true;
													break;
												}
												else if ((k >= tempKGiacHoi) && arrBS[k, j].Contains("-Giác Hơi"))
												{
													isGiacHoi = true;
													break;
												}
											}
										}
										if (isXoaTay || isXoaMay || isXung || isCuu || isRongRoc || isGiacHoi)
										{
											continue;
										}

										arrBS[i, j] = tt.Code + "-Mãng Châm";
										DateTime timeTemp = (DateTime)tt.ttMangCham;
										tt.MangCham = timeTemp.ToString("HH:mm") + "-" + arrNameBS[0, j];
										goto LoopEndMangCham;
									}
								}

								// Full -> thêm giờ kế tiếp
								DateTime timeTTMangCham = ttMangChamTemp.AddMinutes(timeNext);

								if (!"".Equals(tt.ttXung)) tt.ttXung = updateTimeTT(timeTTMangCham, (DateTime)tt.ttMangCham, (DateTime)tt.ttXung);
								if (!"".Equals(tt.ttHongNgoai)) tt.ttHongNgoai = updateTimeTT(timeTTMangCham, (DateTime)tt.ttMangCham, (DateTime)tt.ttHongNgoai);
								if (!"".Equals(tt.ttRongRoc)) tt.ttRongRoc = updateTimeTT(timeTTMangCham, (DateTime)tt.ttMangCham, (DateTime)tt.ttRongRoc);
								if (!"".Equals(tt.ttParafin)) tt.ttParafin = updateTimeTT(timeTTMangCham, (DateTime)tt.ttMangCham, (DateTime)tt.ttParafin);
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(timeTTMangCham, (DateTime)tt.ttMangCham, (DateTime)tt.ttCay);
								if (!"".Equals(tt.ttNgam)) tt.ttNgam = updateTimeTT(timeTTMangCham, (DateTime)tt.ttMangCham, (DateTime)tt.ttNgam);
								if (!"".Equals(tt.ttXong)) tt.ttXong = updateTimeTT(timeTTMangCham, (DateTime)tt.ttMangCham, (DateTime)tt.ttXong);
								if (!"".Equals(tt.ttBo)) tt.ttBo = updateTimeTT(timeTTMangCham, (DateTime)tt.ttMangCham, (DateTime)tt.ttBo);
								if (!"".Equals(tt.ttXoaMay)) tt.ttXoaMay = updateTimeTT(timeTTMangCham, (DateTime)tt.ttMangCham, (DateTime)tt.ttXoaMay);
								if (!"".Equals(tt.ttXoaTay)) tt.ttXoaTay = updateTimeTT(timeTTMangCham, (DateTime)tt.ttMangCham, (DateTime)tt.ttXoaTay);
								if (!"".Equals(tt.ttCuu)) tt.ttCuu = updateTimeTT(timeTTMangCham, (DateTime)tt.ttMangCham, (DateTime)tt.ttCuu);
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(timeTTMangCham, (DateTime)tt.ttMangCham, (DateTime)tt.ttGiacHoi);

								tt.ttMangCham = timeTTMangCham;
								tt.MangCham = timeTTMangCham.ToString("HH:mm");
							}
						}
					LoopEndMangCham:
						// Update lại time tất cả thủ thuật
						logs.Add(tt.Name + "\t\t\t" + "Mãng Châm-OK");
					}

					// Xung
					if (!"".Equals(tt.ttXung))
					{
						// dòng
						for (int i = 0; i < arrBS.GetLength(0); i++)
						{
							DateTime ttXungTemp = (DateTime)tt.ttXung;

							// Check làm đủ tới trưa không, nếu không chuyển qua đầu giờ chiều
							if ((DateTime.Compare(dateMorningEnd, ttXungTemp) > 0 && DateTime.Compare(dateMorningEnd, ttXungTemp.AddMinutes(timeXung)) < 0) ||
								(DateTime.Compare(dateMorningEnd, ttXungTemp) <= 0 && DateTime.Compare(datAfternoonStart, ttXungTemp) > 0))
							{
								if (!"".Equals(tt.ttHongNgoai)) tt.ttHongNgoai = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXung, (DateTime)tt.ttHongNgoai);
								if (!"".Equals(tt.ttRongRoc)) tt.ttRongRoc = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXung, (DateTime)tt.ttRongRoc);
								if (!"".Equals(tt.ttParafin)) tt.ttParafin = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXung, (DateTime)tt.ttParafin);
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXung, (DateTime)tt.ttCay);
								if (!"".Equals(tt.ttNgam)) tt.ttNgam = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXung, (DateTime)tt.ttNgam);
								if (!"".Equals(tt.ttXong)) tt.ttXong = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXung, (DateTime)tt.ttXong);
								if (!"".Equals(tt.ttBo)) tt.ttBo = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXung, (DateTime)tt.ttBo);
								if (!"".Equals(tt.ttXoaMay)) tt.ttXoaMay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXung, (DateTime)tt.ttXoaMay);
								if (!"".Equals(tt.ttXoaTay)) tt.ttXoaTay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXung, (DateTime)tt.ttXoaTay);
								if (!"".Equals(tt.ttCuu)) tt.ttCuu = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXung, (DateTime)tt.ttCuu);
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXung, (DateTime)tt.ttGiacHoi);

								tt.ttXung = datAfternoonStart;
								tt.Xung = datAfternoonStart.ToString("HH:mm");
								continue;
							}
							else
							{
								ttXungTemp = (DateTime)tt.ttXung;
							}

							// Check làm đủ tới tối không, nếu không sẽ log -> có thể tối ưu bước này
							if (DateTime.Compare(datAfternoonEnd, ttXungTemp.AddMinutes(timeXung)) < 0)
							{
								Console.WriteLine("\nThủ thuật này ko đủ giờ làm");
								tt.Xung = "x";
								goto LoopEndXung;
							}
							else
							{
								ttXungTemp = (DateTime)tt.ttXung;
							}

							if (DateTime.Compare(dateTimes[i], ttXungTemp) == 0)
							{
								int tempX = i - 7 < 0 ? 0 : i - 7;
								int tempY = i + 7 >= arrBS.GetLength(0) ? arrBS.GetLength(0) - 1 : i + 7;
								List<int> countDevice = new List<int>();
								for (int k = tempX; k <= tempY; k++)
								{
									int countTemp = 0;
									for (int j = 0; j < arrBS.GetLength(1); j++)
									{
										if (arrBS[k, j] != null && arrBS[k, j] != "x" && arrBS[k, j].Contains("Xung"))
										{
											countTemp++;
										}
									}
									countDevice.Add(countTemp);
								}

								if (tempX == 0 || tempY == arrBS.GetLength(0) - 1)
								{
									int total = countDevice.Sum();
									if (total >= countXung)
									{
										goto LoopGotoNext;
									}
								}
								else
								{
									List<int> listCount = new List<int>();
									for (int idx = 0; idx < countDevice.Count; idx++)
									{
										if (idx + 7 < countDevice.Count)
										{
											int x = countDevice[idx] + countDevice[idx + 1] + countDevice[idx + 2] + countDevice[idx + 3] + countDevice[idx + 4] + countDevice[idx + 5] + countDevice[idx + 6];
											listCount.Add(x);
										}

									}
									foreach (int x in listCount)
									{
										if (x >= countXung)
										{
											goto LoopGotoNext;
										}
									}
								}

								// cột
								for (int j = 0; j < arrBS.GetLength(1); j++)
								{
									if (!BSs[j].ThuThuat.Contains("XUNG"))
									{
										continue;
									}


									if (arrBS[i, j] == null)
									{
										// Check xem trước đó có xoa / cứu / giác hơi / ròng rọc / xung ko
										bool isXoaTay = false;
										bool isXoaMay = false;
										bool isCuu = false;
										bool isGiacHoi = false;
										bool isRongRoc = false;
										bool isXung = false;
										int tempKXoaTay = i - 10 <= 0 ? 0 : i - 10;
										int tempKXoaMay = i - 7 <= 0 ? 0 : i - 7;
										int tempKCuu = i - 7 <= 0 ? 0 : i - 7;
										int tempKRongRoc = i - 7 <= 0 ? 0 : i - 7;
										int tempKXung = i - 7 <= 0 ? 0 : i - 7;
										int tempKGiacHoi = i - 4 <= 0 ? 0 : i - 4;
										int tempIXung = i + 7 >= arrBS.GetLength(0) ? arrBS.GetLength(0) - 1 : i + 7;

										for (int k = tempKXoaTay; k < i; k++)
										{
											if (arrBS[k, j] != null && arrBS[k, j] != "x")
											{
												if (arrBS[k, j].Contains("-Xoa Tay"))
												{
													isXoaTay = true;
													break;
												}
												else if ((k >= tempKXoaMay) && arrBS[k, j].Contains("-Xoa Máy"))
												{
													isXoaMay = true;
													break;
												}
												else if ((k >= tempKCuu) && arrBS[k, j].Contains("-Cứu"))
												{
													isCuu = true;
													break;
												}
												else if ((k >= tempKRongRoc) && arrBS[k, j].Contains("-Ròng Rọc"))
												{
													isRongRoc = true;
													break;
												}
												else if ((k >= tempKGiacHoi) && arrBS[k, j].Contains("-Giác Hơi"))
												{
													isGiacHoi = true;
													break;
												}
											}
										}
										for (int k = i; k <= tempIXung; k++)
										{
											if (arrBS[k, j] != null && arrBS[k, j] != "x")
											{
												isXung = true;
												break;
											}
										}
										if (isXoaTay || isXoaMay || isXung || isCuu || isRongRoc || isGiacHoi)
										{
											continue;
										}

										arrBS[i, j] = tt.Code + "-Xung";
										DateTime timeTemp = (DateTime)tt.ttXung;
										tt.Xung = timeTemp.ToString("HH:mm") + "-" + arrNameBS[0, j]; ;
										goto LoopEndXung;
									}
								}

								LoopGotoNext:
								// Full -> thêm giờ kế tiếp
								DateTime timeTTXung = ttXungTemp.AddMinutes(timeNext);

								if (!"".Equals(tt.ttHongNgoai)) tt.ttHongNgoai = updateTimeTT(timeTTXung, (DateTime)tt.ttXung, (DateTime)tt.ttHongNgoai);
								if (!"".Equals(tt.ttRongRoc)) tt.ttRongRoc = updateTimeTT(timeTTXung, (DateTime)tt.ttXung, (DateTime)tt.ttRongRoc);
								if (!"".Equals(tt.ttParafin)) tt.ttParafin = updateTimeTT(timeTTXung, (DateTime)tt.ttXung, (DateTime)tt.ttParafin);
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(timeTTXung, (DateTime)tt.ttXung, (DateTime)tt.ttCay);
								if (!"".Equals(tt.ttNgam)) tt.ttNgam = updateTimeTT(timeTTXung, (DateTime)tt.ttXung, (DateTime)tt.ttNgam);
								if (!"".Equals(tt.ttXong)) tt.ttXong = updateTimeTT(timeTTXung, (DateTime)tt.ttXung, (DateTime)tt.ttXong);
								if (!"".Equals(tt.ttBo)) tt.ttBo = updateTimeTT(timeTTXung, (DateTime)tt.ttXung, (DateTime)tt.ttBo);
								if (!"".Equals(tt.ttXoaMay)) tt.ttXoaMay = updateTimeTT(timeTTXung, (DateTime)tt.ttXung, (DateTime)tt.ttXoaMay);
								if (!"".Equals(tt.ttXoaTay)) tt.ttXoaTay = updateTimeTT(timeTTXung, (DateTime)tt.ttXung, (DateTime)tt.ttXoaTay);
								if (!"".Equals(tt.ttCuu)) tt.ttCuu = updateTimeTT(timeTTXung, (DateTime)tt.ttXung, (DateTime)tt.ttCuu);
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(timeTTXung, (DateTime)tt.ttXung, (DateTime)tt.ttGiacHoi);

								tt.ttXung = timeTTXung;
								tt.Xung = timeTTXung.ToString("HH:mm");
							}
						}
						LoopEndXung:
						logs.Add(tt.Name + "\t\t\t" + "Xung-OK");

					}

					// Hồng ngoại
					if (!"".Equals(tt.ttHongNgoai))
					{
						// dòng
						for (int i = 0; i < arrBS.GetLength(0); i++)
						{
							DateTime ttHongNgoaiTemp = (DateTime)tt.ttHongNgoai;
							// Check làm đủ tới trưa không, nếu không chuyển qua đầu giờ chiều
							if ((DateTime.Compare(dateMorningEnd, ttHongNgoaiTemp) > 0 && DateTime.Compare(dateMorningEnd, ttHongNgoaiTemp.AddMinutes(timeHongNgoai)) < 0) ||
								(DateTime.Compare(dateMorningEnd, ttHongNgoaiTemp) <= 0 && DateTime.Compare(datAfternoonStart, ttHongNgoaiTemp) > 0))
							{
								if (!"".Equals(tt.ttRongRoc)) tt.ttRongRoc = updateTimeTT(datAfternoonStart, (DateTime)tt.ttHongNgoai, (DateTime)tt.ttRongRoc);
								if (!"".Equals(tt.ttParafin)) tt.ttParafin = updateTimeTT(datAfternoonStart, (DateTime)tt.ttHongNgoai, (DateTime)tt.ttParafin);
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttHongNgoai, (DateTime)tt.ttCay);
								if (!"".Equals(tt.ttNgam)) tt.ttNgam = updateTimeTT(datAfternoonStart, (DateTime)tt.ttHongNgoai, (DateTime)tt.ttNgam);
								if (!"".Equals(tt.ttXong)) tt.ttXong = updateTimeTT(datAfternoonStart, (DateTime)tt.ttHongNgoai, (DateTime)tt.ttXong);
								if (!"".Equals(tt.ttBo)) tt.ttBo = updateTimeTT(datAfternoonStart, (DateTime)tt.ttHongNgoai, (DateTime)tt.ttBo);
								if (!"".Equals(tt.ttXoaMay)) tt.ttXoaMay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttHongNgoai, (DateTime)tt.ttXoaMay);
								if (!"".Equals(tt.ttXoaTay)) tt.ttXoaTay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttHongNgoai, (DateTime)tt.ttXoaTay);
								if (!"".Equals(tt.ttCuu)) tt.ttCuu = updateTimeTT(datAfternoonStart, (DateTime)tt.ttHongNgoai, (DateTime)tt.ttCuu);
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(datAfternoonStart, (DateTime)tt.ttHongNgoai, (DateTime)tt.ttGiacHoi);

								tt.ttHongNgoai = datAfternoonStart;
								tt.HongNgoai = datAfternoonStart.ToString("HH:mm");
								continue;
							}
							else
							{
								ttHongNgoaiTemp = (DateTime)tt.ttHongNgoai;
							}

							// Check làm đủ tới tối không, nếu không sẽ log -> có thể tối ưu bước này
							if (DateTime.Compare(datAfternoonEnd, ttHongNgoaiTemp.AddMinutes(timeHongNgoai)) < 0)
							{
								Console.WriteLine("\nThủ thuật này ko đủ giờ làm");
								tt.HongNgoai = "x";
								goto LoopEndHongNgoai;
							}
							else
							{
								ttHongNgoaiTemp = (DateTime)tt.ttHongNgoai;
							}

							if (DateTime.Compare(dateTimes[i], ttHongNgoaiTemp) == 0)
							{
								// cột
								for (int j = 0; j < arrBS.GetLength(1); j++)
								{
									if (!BSs[j].ThuThuat.Contains("HONGNGOAI"))
									{
										continue;
									}

									if (arrBS[i, j] == null)
									{
										// Check xem trước đó có xoa / cứu / giác hơi / ròng rọc / xung ko
										bool isXoaTay = false;
										bool isXoaMay = false;
										bool isCuu = false;
										bool isGiacHoi = false;
										bool isRongRoc = false;
										bool isXung = false;
										int tempKXoaTay = i - 10 <= 0 ? 0 : i - 10;
										int tempKXoaMay = i - 7 <= 0 ? 0 : i - 7;
										int tempKCuu = i - 7 <= 0 ? 0 : i - 7;
										int tempKRongRoc = i - 7 <= 0 ? 0 : i - 7;
										int tempKXung = i - 7 <= 0 ? 0 : i - 7;
										int tempKGiacHoi = i - 4 <= 0 ? 0 : i - 4;

										for (int k = tempKXoaTay; k < i; k++)
										{
											if (arrBS[k, j] != null)
											{
												if (arrBS[k, j].Contains("-Xoa Tay"))
												{
													isXoaTay = true;
													break;
												}
												else if ((k >= tempKXoaMay) && arrBS[k, j].Contains("-Xoa Máy"))
												{
													isXoaMay = true;
													break;
												}
												else if ((k >= tempKCuu) && arrBS[k, j].Contains("-Cứu"))
												{
													isCuu = true;
													break;
												}
												else if ((k >= tempKRongRoc) && arrBS[k, j].Contains("-Ròng Rọc"))
												{
													isRongRoc = true;
													break;
												}
												else if ((k >= tempKGiacHoi) && arrBS[k, j].Contains("-Giác Hơi"))
												{
													isGiacHoi = true;
													break;
												}
											}
										}
										if (isXoaTay || isXoaMay || isXung || isCuu || isRongRoc || isGiacHoi)
										{
											continue;
										}

										arrBS[i, j] = tt.Code + "-Hồng Ngoại";
										DateTime timeTemp = (DateTime)tt.ttHongNgoai;
										tt.HongNgoai = timeTemp.ToString("HH:mm") + "-" + arrNameBS[0, j];
										goto LoopEndHongNgoai;
									}
								}

								// Full -> thêm giờ kế tiếp
								DateTime timeTTHongNgoai = ttHongNgoaiTemp.AddMinutes(timeNext);
								if (!"".Equals(tt.ttRongRoc)) tt.ttRongRoc = updateTimeTT(timeTTHongNgoai, (DateTime)tt.ttHongNgoai, (DateTime)tt.ttRongRoc);
								if (!"".Equals(tt.ttParafin)) tt.ttParafin = updateTimeTT(timeTTHongNgoai, (DateTime)tt.ttHongNgoai, (DateTime)tt.ttParafin);
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(timeTTHongNgoai, (DateTime)tt.ttHongNgoai, (DateTime)tt.ttCay);
								if (!"".Equals(tt.ttNgam)) tt.ttNgam = updateTimeTT(timeTTHongNgoai, (DateTime)tt.ttHongNgoai, (DateTime)tt.ttNgam);
								if (!"".Equals(tt.ttXong)) tt.ttXong = updateTimeTT(timeTTHongNgoai, (DateTime)tt.ttHongNgoai, (DateTime)tt.ttXong);
								if (!"".Equals(tt.ttBo)) tt.ttBo = updateTimeTT(timeTTHongNgoai, (DateTime)tt.ttHongNgoai, (DateTime)tt.ttBo);
								if (!"".Equals(tt.ttXoaMay)) tt.ttXoaMay = updateTimeTT(timeTTHongNgoai, (DateTime)tt.ttHongNgoai, (DateTime)tt.ttXoaMay);
								if (!"".Equals(tt.ttXoaTay)) tt.ttXoaTay = updateTimeTT(timeTTHongNgoai, (DateTime)tt.ttHongNgoai, (DateTime)tt.ttXoaTay);
								if (!"".Equals(tt.ttCuu)) tt.ttCuu = updateTimeTT(timeTTHongNgoai, (DateTime)tt.ttHongNgoai, (DateTime)tt.ttCuu);
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(timeTTHongNgoai, (DateTime)tt.ttHongNgoai, (DateTime)tt.ttGiacHoi);

								tt.ttHongNgoai = timeTTHongNgoai;
								tt.HongNgoai = timeTTHongNgoai.ToString("HH:mm");
							}
						}
						LoopEndHongNgoai:
						// Update lại time tất cả thủ thuật
						logs.Add(tt.Name + "\t\t\t" + "Hồng Ngoại-OK");

					}

					// Ròng rọc
					if (!"".Equals(tt.ttRongRoc))
					{
						// dòng
						for (int i = 0; i < arrBS.GetLength(0); i++)
						{
							DateTime ttRongRocTemp = (DateTime)tt.ttRongRoc;
							// Check làm đủ tới trưa không, nếu không chuyển qua đầu giờ chiều
							if ((DateTime.Compare(dateMorningEnd, ttRongRocTemp) > 0 && DateTime.Compare(dateMorningEnd, ttRongRocTemp.AddMinutes(timeRongRoc)) < 0) ||
								(DateTime.Compare(dateMorningEnd, ttRongRocTemp) <= 0 && DateTime.Compare(datAfternoonStart, ttRongRocTemp) > 0))
							{
								if (!"".Equals(tt.ttParafin)) tt.ttParafin = updateTimeTT(datAfternoonStart, (DateTime)tt.ttRongRoc, (DateTime)tt.ttParafin);
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttRongRoc, (DateTime)tt.ttCay);
								if (!"".Equals(tt.ttNgam)) tt.ttNgam = updateTimeTT(datAfternoonStart, (DateTime)tt.ttRongRoc, (DateTime)tt.ttNgam);
								if (!"".Equals(tt.ttXong)) tt.ttXong = updateTimeTT(datAfternoonStart, (DateTime)tt.ttRongRoc, (DateTime)tt.ttXong);
								if (!"".Equals(tt.ttBo)) tt.ttBo = updateTimeTT(datAfternoonStart, (DateTime)tt.ttRongRoc, (DateTime)tt.ttBo);
								if (!"".Equals(tt.ttXoaMay)) tt.ttXoaMay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttRongRoc, (DateTime)tt.ttXoaMay);
								if (!"".Equals(tt.ttXoaTay)) tt.ttXoaTay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttRongRoc, (DateTime)tt.ttXoaTay);
								if (!"".Equals(tt.ttCuu)) tt.ttCuu = updateTimeTT(datAfternoonStart, (DateTime)tt.ttRongRoc, (DateTime)tt.ttCuu);
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(datAfternoonStart, (DateTime)tt.ttRongRoc, (DateTime)tt.ttGiacHoi);

								tt.ttRongRoc = datAfternoonStart;
								tt.RongRoc = datAfternoonStart.ToString("HH:mm");
								continue;
							}
							else
							{
								ttRongRocTemp = (DateTime)tt.ttRongRoc;
							}

							// Check làm đủ tới tối không, nếu không sẽ log -> có thể tối ưu bước này
							if (DateTime.Compare(datAfternoonEnd, ttRongRocTemp.AddMinutes(timeRongRoc)) < 0)
							{
								Console.WriteLine("\nThủ thuật này ko đủ giờ làm");
								tt.RongRoc = "x";
								goto LoopEndRongRoc;
							}
							else
							{
								ttRongRocTemp = (DateTime)tt.ttRongRoc;
							}

							if (DateTime.Compare(dateTimes[i], ttRongRocTemp) == 0)
							{
								// cột
								for (int j = 0; j < arrBS.GetLength(1); j++)
								{
									if (!BSs[j].ThuThuat.Contains("RONGROC"))
									{
										continue;
									}


									if (arrBS[i, j] == null)
									{
										// Check xem trước đó có xoa / cứu / giác hơi / ròng rọc / xung ko
										bool isXoaTay = false;
										bool isXoaMay = false;
										bool isCuu = false;
										bool isGiacHoi = false;
										bool isRongRoc = false;
										bool isXung = false;
										int tempKXoaTay = i - 10 <= 0 ? 0 : i - 10;
										int tempKXoaMay = i - 7 <= 0 ? 0 : i - 7;
										int tempKCuu = i - 7 <= 0 ? 0 : i - 7;
										int tempKRongRoc = i - 7 <= 0 ? 0 : i - 7;
										int tempKXung = i - 7 <= 0 ? 0 : i - 7;
										int tempKGiacHoi = i - 4 <= 0 ? 0 : i - 4;
										int tempIRongRoc = i + 7 >= arrBS.GetLength(0) ? arrBS.GetLength(0) - 1 : i + 7;

										for (int k = tempKXoaTay; k < i; k++)
										{
											if (arrBS[k, j] != null && arrBS[k, j] != "x")
											{
												if (arrBS[k, j].Contains("-Xoa Tay"))
												{
													isXoaTay = true;
													break;
												}
												else if ((k >= tempKXoaMay) && arrBS[k, j].Contains("-Xoa Máy"))
												{
													isXoaMay = true;
													break;
												}
												else if ((k >= tempKCuu) && arrBS[k, j].Contains("-Cứu"))
												{
													isCuu = true;
													break;
												}
												else if ((k >= tempKRongRoc) && arrBS[k, j].Contains("-Ròng Rọc"))
												{
													isRongRoc = true;
													break;
												}
												else if ((k >= tempKGiacHoi) && arrBS[k, j].Contains("-Giác Hơi"))
												{
													isGiacHoi = true;
													break;
												}
											}
										}
										for (int k = i; k <= tempIRongRoc; k++)
										{
											if (arrBS[k, j] != null && arrBS[k, j] != "x")
											{
												isRongRoc = true;
												break;
											}
										}
										if (isXoaTay || isXoaMay || isXung || isCuu || isRongRoc || isGiacHoi)
										{
											continue;
										}

										arrBS[i, j] = tt.Code + "-Ròng Rọc";
										DateTime timeTemp = (DateTime)tt.ttRongRoc;
										tt.RongRoc = timeTemp.ToString("HH:mm") + "-" + arrNameBS[0, j];
										goto LoopEndRongRoc;
									}
								}

								// Full -> thêm giờ kế tiếp
								DateTime timeTTRongRoc = ttRongRocTemp.AddMinutes(timeNext);
								if (!"".Equals(tt.ttParafin)) tt.ttParafin = updateTimeTT(timeTTRongRoc, (DateTime)tt.ttRongRoc, (DateTime)tt.ttParafin);
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(timeTTRongRoc, (DateTime)tt.ttRongRoc, (DateTime)tt.ttCay);
								if (!"".Equals(tt.ttNgam)) tt.ttNgam = updateTimeTT(timeTTRongRoc, (DateTime)tt.ttRongRoc, (DateTime)tt.ttNgam);
								if (!"".Equals(tt.ttXong)) tt.ttXong = updateTimeTT(timeTTRongRoc, (DateTime)tt.ttRongRoc, (DateTime)tt.ttXong);
								if (!"".Equals(tt.ttBo)) tt.ttBo = updateTimeTT(timeTTRongRoc, (DateTime)tt.ttRongRoc, (DateTime)tt.ttBo);
								if (!"".Equals(tt.ttXoaMay)) tt.ttXoaMay = updateTimeTT(timeTTRongRoc, (DateTime)tt.ttRongRoc, (DateTime)tt.ttXoaMay);
								if (!"".Equals(tt.ttXoaTay)) tt.ttXoaTay = updateTimeTT(timeTTRongRoc, (DateTime)tt.ttRongRoc, (DateTime)tt.ttXoaTay);
								if (!"".Equals(tt.ttCuu)) tt.ttCuu = updateTimeTT(timeTTRongRoc, (DateTime)tt.ttRongRoc, (DateTime)tt.ttCuu);
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(timeTTRongRoc, (DateTime)tt.ttRongRoc, (DateTime)tt.ttGiacHoi);

								tt.ttRongRoc = timeTTRongRoc;
								tt.RongRoc = timeTTRongRoc.ToString("HH:mm");
							}
						}
					LoopEndRongRoc:
						// Update lại time tất cả thủ thuật
						logs.Add(tt.Name + "\t\t\t" + "Ròng Rọc-OK");

					}

					// Parafin
					if (!"".Equals(tt.ttParafin))
					{
						// dòng
						for (int i = 0; i < arrBS.GetLength(0); i++)
						{
							DateTime ttParafinTemp = (DateTime)tt.ttParafin;

							// Check làm đủ tới trưa không, nếu không chuyển qua đầu giờ chiều
							if ((DateTime.Compare(dateMorningEnd, ttParafinTemp) > 0 && DateTime.Compare(dateMorningEnd, ttParafinTemp.AddMinutes(timeParafin)) < 0) ||
								(DateTime.Compare(dateMorningEnd, ttParafinTemp) <= 0 && DateTime.Compare(datAfternoonStart, ttParafinTemp) > 0))
							{
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttParafin, (DateTime)tt.ttCay);
								if (!"".Equals(tt.ttNgam)) tt.ttNgam = updateTimeTT(datAfternoonStart, (DateTime)tt.ttParafin, (DateTime)tt.ttNgam);
								if (!"".Equals(tt.ttXong)) tt.ttXong = updateTimeTT(datAfternoonStart, (DateTime)tt.ttParafin, (DateTime)tt.ttXong);
								if (!"".Equals(tt.ttBo)) tt.ttBo = updateTimeTT(datAfternoonStart, (DateTime)tt.ttParafin, (DateTime)tt.ttBo);
								if (!"".Equals(tt.ttXoaMay)) tt.ttXoaMay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttParafin, (DateTime)tt.ttXoaMay);
								if (!"".Equals(tt.ttXoaTay)) tt.ttXoaTay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttParafin, (DateTime)tt.ttXoaTay);
								if (!"".Equals(tt.ttCuu)) tt.ttCuu = updateTimeTT(datAfternoonStart, (DateTime)tt.ttParafin, (DateTime)tt.ttCuu);
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(datAfternoonStart, (DateTime)tt.ttParafin, (DateTime)tt.ttGiacHoi);

								tt.ttParafin = datAfternoonStart;
								tt.Parafin = datAfternoonStart.ToString("HH:mm");
								continue;
							}
							else
							{
								ttParafinTemp = (DateTime)tt.ttParafin;
							}

							// Check làm đủ tới tối không, nếu không sẽ log -> có thể tối ưu bước này
							if (DateTime.Compare(datAfternoonEnd, ttParafinTemp.AddMinutes(timeParafin)) < 0)
							{
								Console.WriteLine("\nThủ thuật này ko đủ giờ làm");
								tt.Parafin = "x";
								goto LoopEndParafin;
							}
							else
							{
								ttParafinTemp = (DateTime)tt.ttParafin;
							}

							if (DateTime.Compare(dateTimes[i], ttParafinTemp) == 0)
							{
								// cột
								for (int j = 0; j < arrBS.GetLength(1); j++)
								{
									if (!BSs[j].ThuThuat.Contains("PARAFIN"))
									{
										continue;
									}

									if (arrBS[i, j] == null)
									{

										// Check xem trước đó có xoa / cứu / giác hơi / ròng rọc / xung ko
										bool isXoaTay = false;
										bool isXoaMay = false;
										bool isCuu = false;
										bool isGiacHoi = false;
										bool isRongRoc = false;
										bool isXung = false;
										int tempKXoaTay = i - 10 <= 0 ? 0 : i - 10;
										int tempKXoaMay = i - 7 <= 0 ? 0 : i - 7;
										int tempKCuu = i - 7 <= 0 ? 0 : i - 7;
										int tempKRongRoc = i - 7 <= 0 ? 0 : i - 7;
										int tempKXung = i - 7 <= 0 ? 0 : i - 7;
										int tempKGiacHoi = i - 4 <= 0 ? 0 : i - 4;

										for (int k = tempKXoaTay; k < i; k++)
										{
											if (arrBS[k, j] != null)
											{
												if (arrBS[k, j].Contains("-Xoa Tay"))
												{
													isXoaTay = true;
													break;
												}
												else if ((k >= tempKXoaMay) && arrBS[k, j].Contains("-Xoa Máy"))
												{
													isXoaMay = true;
													break;
												}
												else if ((k >= tempKCuu) && arrBS[k, j].Contains("-Cứu"))
												{
													isCuu = true;
													break;
												}
												else if ((k >= tempKRongRoc) && arrBS[k, j].Contains("-Ròng Rọc"))
												{
													isRongRoc = true;
													break;
												}
												else if ((k >= tempKGiacHoi) && arrBS[k, j].Contains("-Giác Hơi"))
												{
													isGiacHoi = true;
													break;
												}
											}
										}
										if (isXoaTay || isXoaMay || isXung || isCuu || isRongRoc || isGiacHoi)
										{
											continue;
										}

										arrBS[i, j] = tt.Code + "-Parafin";
										DateTime timeTemp = (DateTime)tt.ttParafin;
										tt.Parafin = timeTemp.ToString("HH:mm") + "-" + arrNameBS[0, j];
										goto LoopEndParafin;
									}
								}

								// Full -> thêm giờ kế tiếp
								DateTime timeTTParafin = ttParafinTemp.AddMinutes(timeNext);
								if (!"".Equals(tt.ttCay)) tt.ttCay = updateTimeTT(timeTTParafin, (DateTime)tt.ttParafin, (DateTime)tt.ttCay);
								if (!"".Equals(tt.ttNgam)) tt.ttNgam = updateTimeTT(timeTTParafin, (DateTime)tt.ttParafin, (DateTime)tt.ttNgam);
								if (!"".Equals(tt.ttXong)) tt.ttXong = updateTimeTT(timeTTParafin, (DateTime)tt.ttParafin, (DateTime)tt.ttXong);
								if (!"".Equals(tt.ttBo)) tt.ttBo = updateTimeTT(timeTTParafin, (DateTime)tt.ttParafin, (DateTime)tt.ttBo);
								if (!"".Equals(tt.ttXoaMay)) tt.ttXoaMay = updateTimeTT(timeTTParafin, (DateTime)tt.ttParafin, (DateTime)tt.ttXoaMay);
								if (!"".Equals(tt.ttXoaTay)) tt.ttXoaTay = updateTimeTT(timeTTParafin, (DateTime)tt.ttParafin, (DateTime)tt.ttXoaTay);
								if (!"".Equals(tt.ttCuu)) tt.ttCuu = updateTimeTT(timeTTParafin, (DateTime)tt.ttParafin, (DateTime)tt.ttCuu);
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(timeTTParafin, (DateTime)tt.ttParafin, (DateTime)tt.ttGiacHoi);

								tt.ttParafin = timeTTParafin;
								tt.Parafin = timeTTParafin.ToString("HH:mm");
							}
						}
						LoopEndParafin:
						logs.Add(tt.Name + "\t\t\t" + "Parafin-OK");
					}

					// Cấy
					if (!"".Equals(tt.ttCay))
					{
						// dòng
						for (int i = 0; i < arrBS.GetLength(0); i++)
						{
							DateTime ttCayTemp = (DateTime)tt.ttCay;

							// Check làm đủ tới trưa không, nếu không chuyển qua đầu giờ chiều
							if ((DateTime.Compare(dateMorningEnd, ttCayTemp) > 0 && DateTime.Compare(dateMorningEnd, ttCayTemp.AddMinutes(timeCay)) < 0) ||
								(DateTime.Compare(dateMorningEnd, ttCayTemp) <= 0 && DateTime.Compare(datAfternoonStart, ttCayTemp) > 0))
							{
								if (!"".Equals(tt.ttNgam)) tt.ttNgam = updateTimeTT(datAfternoonStart, (DateTime)tt.ttCay, (DateTime)tt.ttNgam);
								if (!"".Equals(tt.ttXong)) tt.ttXong = updateTimeTT(datAfternoonStart, (DateTime)tt.ttCay, (DateTime)tt.ttXong);
								if (!"".Equals(tt.ttBo)) tt.ttBo = updateTimeTT(datAfternoonStart, (DateTime)tt.ttCham, (DateTime)tt.ttBo);
								if (!"".Equals(tt.ttXoaMay)) tt.ttXoaMay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttCay, (DateTime)tt.ttXoaMay);
								if (!"".Equals(tt.ttXoaTay)) tt.ttXoaTay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttCay, (DateTime)tt.ttXoaTay);
								if (!"".Equals(tt.ttCuu)) tt.ttCuu = updateTimeTT(datAfternoonStart, (DateTime)tt.ttCay, (DateTime)tt.ttCuu);
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(datAfternoonStart, (DateTime)tt.ttCay, (DateTime)tt.ttGiacHoi);

								tt.ttCay = datAfternoonStart;
								tt.Cay = datAfternoonStart.ToString("HH:mm");
								continue;
							}
							else
							{
								ttCayTemp = (DateTime)tt.ttCay;
							}

							// Check làm đủ tới tối không, nếu không sẽ log -> có thể tối ưu bước này
							if (DateTime.Compare(datAfternoonEnd, ttCayTemp.AddMinutes(timeCay)) < 0)
							{
								Console.WriteLine("\nThủ thuật này ko đủ giờ làm");
								tt.Cay = "x";
								goto LoopEndCay;
							}
							else
							{
								ttCayTemp = (DateTime)tt.ttCay;
							}

							if (DateTime.Compare(dateTimes[i], ttCayTemp) == 0)
							{
								// cột
								for (int j = 0; j < arrBS.GetLength(1); j++)
								{
									
									if (!BSs[j].ThuThuat.Contains("CAY"))
									{
										continue;
									}


									if (arrBS[i, j] == null)
									{

										// Check xem trước đó có xoa / cứu / giác hơi / ròng rọc / xung ko
										bool isXoaTay = false;
										bool isXoaMay = false;
										bool isCuu = false;
										bool isGiacHoi = false;
										bool isRongRoc = false;
										bool isXung = false;
										int tempKXoaTay = i - 10 <= 0 ? 0 : i - 10;
										int tempKXoaMay = i - 7 <= 0 ? 0 : i - 7;
										int tempKCuu = i - 7 <= 0 ? 0 : i - 7;
										int tempKRongRoc = i - 7 <= 0 ? 0 : i - 7;
										int tempKXung = i - 7 <= 0 ? 0 : i - 7;
										int tempKGiacHoi = i - 4 <= 0 ? 0 : i - 4;

										for (int k = tempKXoaTay; k < i; k++)
										{
											if (arrBS[k, j] != null)
											{
												if (arrBS[k, j].Contains("-Xoa Tay"))
												{
													isXoaTay = true;
													break;
												}
												else if ((k >= tempKXoaMay) && arrBS[k, j].Contains("-Xoa Máy"))
												{
													isXoaMay = true;
													break;
												}
												else if ((k >= tempKCuu) && arrBS[k, j].Contains("-Cứu"))
												{
													isCuu = true;
													break;
												}
												else if ((k >= tempKRongRoc) && arrBS[k, j].Contains("-Ròng Rọc"))
												{
													isRongRoc = true;
													break;
												}
												else if ((k >= tempKGiacHoi) && arrBS[k, j].Contains("-Giác Hơi"))
												{
													isGiacHoi = true;
													break;
												}
											}
										}
										if (isXoaTay || isXoaMay || isXung || isCuu || isRongRoc || isGiacHoi)
										{
											continue;
										}

										arrBS[i, j] = tt.Code + "-Cấy";
										DateTime timeTemp = (DateTime)tt.ttCay;
										tt.Cay = timeTemp.ToString("HH:mm") + "-" + arrNameBS[0, j];
										goto LoopEndCay;
									}
								}

								// Full -> thêm giờ kế tiếp
								DateTime timeTTCay = ttCayTemp.AddMinutes(timeNext);

								if (!"".Equals(tt.ttNgam)) tt.ttNgam = updateTimeTT(timeTTCay, (DateTime)tt.ttCay, (DateTime)tt.ttNgam);
								if (!"".Equals(tt.ttXong)) tt.ttXong = updateTimeTT(timeTTCay, (DateTime)tt.ttCay, (DateTime)tt.ttXong);
								if (!"".Equals(tt.ttBo)) tt.ttBo = updateTimeTT(timeTTCay, (DateTime)tt.ttCay, (DateTime)tt.ttBo);
								if (!"".Equals(tt.ttXoaMay)) tt.ttXoaMay = updateTimeTT(timeTTCay, (DateTime)tt.ttCay, (DateTime)tt.ttXoaMay);
								if (!"".Equals(tt.ttXoaTay)) tt.ttXoaTay = updateTimeTT(timeTTCay, (DateTime)tt.ttCay, (DateTime)tt.ttXoaTay);
								if (!"".Equals(tt.ttCuu)) tt.ttCuu = updateTimeTT(timeTTCay, (DateTime)tt.ttCay, (DateTime)tt.ttCuu);
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(timeTTCay, (DateTime)tt.ttCay, (DateTime)tt.ttGiacHoi);

								tt.ttCay = timeTTCay;
								tt.Cay = timeTTCay.ToString("HH:mm");
							}
						}
						LoopEndCay:
						logs.Add(tt.Name + "\t\t\t" + "Cấy-OK");
					}

					// Ngâm
					if (!"".Equals(tt.ttNgam))
					{
						// dòng
						for (int i = 0; i < arrBS.GetLength(0); i++)
						{
							DateTime ttNgamTemp = (DateTime)tt.ttNgam;

							// Check làm đủ tới trưa không, nếu không chuyển qua đầu giờ chiều
							if ((DateTime.Compare(dateMorningEnd, ttNgamTemp) > 0 && DateTime.Compare(dateMorningEnd, ttNgamTemp.AddMinutes(timeNgam)) < 0) ||
								(DateTime.Compare(dateMorningEnd, ttNgamTemp) <= 0 && DateTime.Compare(datAfternoonStart, ttNgamTemp) > 0))
							{
								if (!"".Equals(tt.ttXong)) tt.ttXong = updateTimeTT(datAfternoonStart, (DateTime)tt.ttNgam, (DateTime)tt.ttXong);
								if (!"".Equals(tt.ttBo)) tt.ttBo = updateTimeTT(datAfternoonStart, (DateTime)tt.ttNgam, (DateTime)tt.ttBo);
								if (!"".Equals(tt.ttXoaMay)) tt.ttXoaMay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttNgam, (DateTime)tt.ttXoaMay);
								if (!"".Equals(tt.ttXoaTay)) tt.ttXoaTay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttNgam, (DateTime)tt.ttXoaTay);
								if (!"".Equals(tt.ttCuu)) tt.ttCuu = updateTimeTT(datAfternoonStart, (DateTime)tt.ttNgam, (DateTime)tt.ttCuu);
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(datAfternoonStart, (DateTime)tt.ttNgam, (DateTime)tt.ttGiacHoi);

								tt.ttNgam = datAfternoonStart;
								tt.Ngam = datAfternoonStart.ToString("HH:mm");
								continue;
							}
							else
							{
								ttNgamTemp = (DateTime)tt.ttNgam;
							}

							// Check làm đủ tới tối không, nếu không sẽ log -> có thể tối ưu bước này
							if (DateTime.Compare(datAfternoonEnd, ttNgamTemp.AddMinutes(timeNgam)) < 0)
							{
								Console.WriteLine("\nThủ thuật này ko đủ giờ làm");
								tt.Ngam = "x";
								goto LoopEndNgam;
							}
							else
							{
								ttNgamTemp = (DateTime)tt.ttNgam;
							}

							if (DateTime.Compare(dateTimes[i], ttNgamTemp) == 0)
							{
								
								/*int tempX = i - 6 < 0 ? 0 : i - 6;
								int tempY = i + 6 >= arrBS.GetLength(0) ? arrBS.GetLength(0) : i + 6;*/
								int tempX = i - 7 < 0 ? 0 : i - 7;
								int tempY = i + 7 >= arrBS.GetLength(0) ? arrBS.GetLength(0) - 1 : i + 7;
								List<int> countDevice = new List<int>();
								for (int k = tempX; k <= tempY; k++)
								{
									int countTemp = 0;
									for (int j = 0; j < arrBS.GetLength(1); j++)
									{
										if (arrBS[k, j] != null && arrBS[k, j] != "x" && arrBS[k, j].Contains("Ngâm"))
										{
											countTemp++;
										}
									}
									countDevice.Add(countTemp);
								}

								if (tempX == 0 || tempY == arrBS.GetLength(0) - 1)
								{
									int total = countDevice.Sum();
									if (total >= countNgam)
									{
										goto LoopGotoNext;
									}
								}
								else
								{
									List<int> listCount = new List<int>();
									for (int idx = 0; idx < countDevice.Count; idx++)
									{
									
										if (idx + 7 < countDevice.Count)
										{
											int x = countDevice[idx] + countDevice[idx + 1] + countDevice[idx + 2] + countDevice[idx + 3] + countDevice[idx + 4] + countDevice[idx + 5] + countDevice[idx + 6];
											listCount.Add(x);
										}

									}
									foreach (int x in listCount)
									{
										if (x >= countNgam)
										{
											goto LoopGotoNext;
										}
									}
								}

								// cột
								for (int j = 0; j < arrBS.GetLength(1); j++)
								{

								
									if (!BSs[j].ThuThuat.Contains("NGAM"))
									{
										continue;
									}

									if (arrBS[i, j] == null)
									{
										// Check xem trước đó có xoa / cứu / giác hơi / ròng rọc / xung ko
										bool isXoaTay = false;
										bool isXoaMay = false;
										bool isCuu = false;
										bool isGiacHoi = false;
										bool isRongRoc = false;
										bool isXung = false;
										int tempKXoaTay = i - 10 <= 0 ? 0 : i - 10;
										int tempKXoaMay = i - 7 <= 0 ? 0 : i - 7;
										int tempKCuu = i - 7 <= 0 ? 0 : i - 7;
										int tempKRongRoc = i - 7 <= 0 ? 0 : i - 7;
										int tempKXung = i - 7 <= 0 ? 0 : i - 7;
										int tempKGiacHoi = i - 4 <= 0 ? 0 : i - 4;

										for (int k = tempKXoaTay; k < i; k++)
										{
											if (arrBS[k, j] != null)
											{
												if (arrBS[k, j].Contains("-Xoa Tay"))
												{
													isXoaTay = true;
													break;
												}
												else if ((k >= tempKXoaMay) && arrBS[k, j].Contains("-Xoa Máy"))
												{
													isXoaMay = true;
													break;
												}
												else if ((k >= tempKCuu) && arrBS[k, j].Contains("-Cứu"))
												{
													isCuu = true;
													break;
												}
												else if ((k >= tempKRongRoc) && arrBS[k, j].Contains("-Ròng Rọc"))
												{
													isRongRoc = true;
													break;
												}
												else if ((k >= tempKGiacHoi) && arrBS[k, j].Contains("-Giác Hơi"))
												{
													isGiacHoi = true;
													break;
												}
											}
										}
										if (isXoaTay || isXoaMay || isXung || isCuu || isRongRoc || isGiacHoi)
										{
											continue;
										}

										arrBS[i, j] = tt.Code + "-Ngâm";
										DateTime timeTemp = (DateTime)tt.ttNgam;
										tt.Ngam = timeTemp.ToString("HH:mm") + "-" + arrNameBS[0, j]; ;
										goto LoopEndNgam;
									}
								}

								LoopGotoNext:
								// Full -> thêm giờ kế tiếp
								DateTime timeTTNgam = ttNgamTemp.AddMinutes(timeNext);

								if (!"".Equals(tt.ttXong)) tt.ttXong = updateTimeTT(timeTTNgam, (DateTime)tt.ttNgam, (DateTime)tt.ttXong);
								if (!"".Equals(tt.ttBo)) tt.ttBo = updateTimeTT(timeTTNgam, (DateTime)tt.ttNgam, (DateTime)tt.ttBo);
								if (!"".Equals(tt.ttXoaMay)) tt.ttXoaMay = updateTimeTT(timeTTNgam, (DateTime)tt.ttNgam, (DateTime)tt.ttXoaMay);
								if (!"".Equals(tt.ttXoaTay)) tt.ttXoaTay = updateTimeTT(timeTTNgam, (DateTime)tt.ttNgam, (DateTime)tt.ttXoaTay);
								if (!"".Equals(tt.ttCuu)) tt.ttCuu = updateTimeTT(timeTTNgam, (DateTime)tt.ttNgam, (DateTime)tt.ttCuu);
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(timeTTNgam, (DateTime)tt.ttNgam, (DateTime)tt.ttGiacHoi);

								tt.ttNgam = timeTTNgam;
								tt.Ngam = timeTTNgam.ToString("HH:mm");
							}
						}
						LoopEndNgam:
						logs.Add(tt.Name + "\t\t\t" + "Ngâm-OK");
					}

					// Xông
					if (!"".Equals(tt.ttXong))
					{
						// dòng
						for (int i = 0; i < arrBS.GetLength(0); i++)
						{
							DateTime ttXongTemp = (DateTime)tt.ttXong;

							// Check làm đủ tới trưa không, nếu không chuyển qua đầu giờ chiều
							if ((DateTime.Compare(dateMorningEnd, ttXongTemp) > 0 && DateTime.Compare(dateMorningEnd, ttXongTemp.AddMinutes(timeXong)) < 0) ||
								(DateTime.Compare(dateMorningEnd, ttXongTemp) <= 0 && DateTime.Compare(datAfternoonStart, ttXongTemp) > 0))
							{
								if (!"".Equals(tt.ttBo)) tt.ttBo = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXong, (DateTime)tt.ttBo);
								if (!"".Equals(tt.ttXoaMay)) tt.ttXoaMay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXong, (DateTime)tt.ttXoaMay);
								if (!"".Equals(tt.ttXoaTay)) tt.ttXoaTay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXong, (DateTime)tt.ttXoaTay);
								if (!"".Equals(tt.ttCuu)) tt.ttCuu = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXong, (DateTime)tt.ttCuu);
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXong, (DateTime)tt.ttGiacHoi);

								tt.ttXong = datAfternoonStart;
								tt.Xong = datAfternoonStart.ToString("HH:mm");
								continue;
							}
							else
							{
								ttXongTemp = (DateTime)tt.ttXong;
							}

							// Check làm đủ tới tối không, nếu không sẽ log -> có thể tối ưu bước này
							if (DateTime.Compare(datAfternoonEnd, ttXongTemp.AddMinutes(timeXong)) < 0)
							{
								Console.WriteLine("\nThủ thuật này ko đủ giờ làm");
								tt.Xong = "x";
								goto LoopEndXong;
							}
							else
							{
								ttXongTemp = (DateTime)tt.ttXong;
							}

							if (DateTime.Compare(dateTimes[i], ttXongTemp) == 0)
							{
								
								/*int tempX = i - 6 < 0 ? 0 : i - 6;
								int tempY = i + 6 >= arrBS.GetLength(0) ? arrBS.GetLength(0) : i + 6;*/
								int tempX = i - 7 < 0 ? 0 : i - 7;
								int tempY = i + 7 >= arrBS.GetLength(0) ? arrBS.GetLength(0) - 1 : i + 7;
								List<int> countDevice = new List<int>();
								for (int k = tempX; k <= tempY; k++)
								{
									int countTempX = 0;
									for (int j = 0; j < arrBS.GetLength(1); j++)
									{
										if (arrBS[k, j] != null && arrBS[k, j] != "x" && arrBS[k, j].Contains("Xông"))
										{
											countTempX++;
										}
									}
									countDevice.Add(countTempX);
								}

								if (tempX == 0 || tempY == arrBS.GetLength(0) - 1)
								{
									int total = countDevice.Sum();
									if (total >= countXong)
									{
										goto LoopGotoNext;
									}
								}
								else
								{
									List<int> listCount = new List<int>();
									for (int idx = 0; idx < countDevice.Count; idx++)
									{
										if (idx + 7 < countDevice.Count)
										{
											int x = countDevice[idx] + countDevice[idx + 1] + countDevice[idx + 2] + countDevice[idx + 3] + countDevice[idx + 4] + countDevice[idx + 5] + countDevice[idx + 6];
											listCount.Add(x);
										}

									}
									foreach (int x in listCount)
									{
										if (x >= countXong)
										{
											goto LoopGotoNext;
										}
									}
								}

								// cột
								for (int j = 0; j < arrBS.GetLength(1); j++)
								{

									

									if (!BSs[j].ThuThuat.Contains("XONG"))
									{
										continue;
									}

									

									if (arrBS[i, j] == null)
									{
										// Check xem trước đó có xoa / cứu / giác hơi / ròng rọc / xung ko
										bool isXoaTay = false;
										bool isXoaMay = false;
										bool isCuu = false;
										bool isGiacHoi = false;
										bool isRongRoc = false;
										bool isXung = false;
										int tempKXoaTay = i - 10 <= 0 ? 0 : i - 10;
										int tempKXoaMay = i - 7 <= 0 ? 0 : i - 7;
										int tempKCuu = i - 7 <= 0 ? 0 : i - 7;
										int tempKRongRoc = i - 7 <= 0 ? 0 : i - 7;
										int tempKXung = i - 7 <= 0 ? 0 : i - 7;
										int tempKGiacHoi = i - 4 <= 0 ? 0 : i - 4;

										for (int k = tempKXoaTay; k < i; k++)
										{
											if (arrBS[k, j] != null)
											{
												if (arrBS[k, j].Contains("-Xoa Tay"))
												{
													isXoaTay = true;
													break;
												}
												else if ((k >= tempKXoaMay) && arrBS[k, j].Contains("-Xoa Máy"))
												{
													isXoaMay = true;
													break;
												}
												else if ((k >= tempKCuu) && arrBS[k, j].Contains("-Cứu"))
												{
													isCuu = true;
													break;
												}
												else if ((k >= tempKRongRoc) && arrBS[k, j].Contains("-Ròng Rọc"))
												{
													isRongRoc = true;
													break;
												}
												else if ((k >= tempKGiacHoi) && arrBS[k, j].Contains("-Giác Hơi"))
												{
													isGiacHoi = true;
													break;
												}
											}
										}
										if (isXoaTay || isXoaMay || isXung || isCuu || isRongRoc || isGiacHoi)
										{
											continue;
										}

										arrBS[i, j] = tt.Code + "-Xông";
										DateTime timeTemp = (DateTime)tt.ttXong;
										tt.Xong = timeTemp.ToString("HH:mm") + "-" + arrNameBS[0, j];
										goto LoopEndXong;
									}
								}

								LoopGotoNext:
								// Full -> thêm giờ kế tiếp
								DateTime timeTTXong = ttXongTemp.AddMinutes(timeNext);

								if (!"".Equals(tt.ttBo)) tt.ttBo = updateTimeTT(timeTTXong, (DateTime)tt.ttXong, (DateTime)tt.ttBo);
								if (!"".Equals(tt.ttXoaMay)) tt.ttXoaMay = updateTimeTT(timeTTXong, (DateTime)tt.ttXong, (DateTime)tt.ttXoaMay);
								if (!"".Equals(tt.ttXoaTay)) tt.ttXoaTay = updateTimeTT(timeTTXong, (DateTime)tt.ttXong, (DateTime)tt.ttXoaTay);
								if (!"".Equals(tt.ttCuu)) tt.ttCuu = updateTimeTT(timeTTXong, (DateTime)tt.ttXong, (DateTime)tt.ttCuu);
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(timeTTXong, (DateTime)tt.ttXong, (DateTime)tt.ttGiacHoi);

								tt.ttXong = timeTTXong;
								tt.Xong = timeTTXong.ToString("HH:mm");
							}
						}
						LoopEndXong:
						logs.Add(tt.Name + "\t\t\t" + "Xông-OK");
					}

					// Bó
					if (!"".Equals(tt.ttBo))
					{
						// dòng
						for (int i = 0; i < arrBS.GetLength(0); i++)
						{
							DateTime ttBoTemp = (DateTime)tt.ttBo;

							// Check làm đủ tới trưa không, nếu không chuyển qua đầu giờ chiều
							if ((DateTime.Compare(dateMorningEnd, ttBoTemp) > 0 && DateTime.Compare(dateMorningEnd, ttBoTemp.AddMinutes(timeBo)) < 0) ||
								(DateTime.Compare(dateMorningEnd, ttBoTemp) <= 0 && DateTime.Compare(datAfternoonStart, ttBoTemp) > 0))
							{
								if (!"".Equals(tt.ttXoaMay)) tt.ttXoaMay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttBo, (DateTime)tt.ttXoaMay);
								if (!"".Equals(tt.ttXoaTay)) tt.ttXoaTay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttBo, (DateTime)tt.ttXoaTay);
								if (!"".Equals(tt.ttCuu)) tt.ttCuu = updateTimeTT(datAfternoonStart, (DateTime)tt.ttBo, (DateTime)tt.ttCuu);
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(datAfternoonStart, (DateTime)tt.ttBo, (DateTime)tt.ttGiacHoi);

								tt.ttBo = datAfternoonStart;
								tt.Bo = datAfternoonStart.ToString("HH:mm");
								continue;
							}
							else
							{
								ttBoTemp = (DateTime)tt.ttBo;
							}

							// Check làm đủ tới tối không, nếu không sẽ log -> có thể tối ưu bước này
							if (DateTime.Compare(datAfternoonEnd, ttBoTemp.AddMinutes(timeBo)) < 0)
							{
								Console.WriteLine("\nThủ thuật này ko đủ giờ làm");
								tt.Bo = "x";
								goto LoopEndBo;
							}
							else
							{
								ttBoTemp = (DateTime)tt.ttBo;
							}

							if (DateTime.Compare(dateTimes[i], ttBoTemp) == 0)
							{
								
								/*int tempX = i - 6 < 0 ? 0 : i - 6;
								int tempY = i + 6 >= arrBS.GetLength(0) ? arrBS.GetLength(0) : i + 6;*/
								int tempX = i - 7 < 0 ? 0 : i - 7;
								int tempY = i + 7 >= arrBS.GetLength(0) ? arrBS.GetLength(0) - 1 : i + 7;
								List<int> countDevice = new List<int>();
								for (int k = tempX; k <= tempY; k++)
								{
									int countTempX = 0;
									for (int j = 0; j < arrBS.GetLength(1); j++)
									{
										if (arrBS[k, j] != null && arrBS[k, j] != "x" && arrBS[k, j].Contains("Bó"))
										{
											countTempX++;
										}
									}
									countDevice.Add(countTempX);
								}

								if (tempX == 0 || tempY == arrBS.GetLength(0) - 1)
								{
									int total = countDevice.Sum();
									if (total >= countBo)
									{
										goto LoopGotoNext;
									}
								}
								else
								{
									List<int> listCount = new List<int>();
									for (int idx = 0; idx < countDevice.Count; idx++)
									{
										if (idx + 7 < countDevice.Count)
										{
											int x = countDevice[idx] + countDevice[idx + 1] + countDevice[idx + 2] + countDevice[idx + 3] + countDevice[idx + 4] + countDevice[idx + 5] + countDevice[idx + 6];
											listCount.Add(x);
										}

									}
									foreach (int x in listCount)
									{
										if (x >= countBo)
										{
											goto LoopGotoNext;
										}
									}
								}

								// cột
								for (int j = 0; j < arrBS.GetLength(1); j++)
								{

								

									if (!BSs[j].ThuThuat.Contains("BO"))
									{
										continue;
									}

									if (arrBS[i, j] == null)
									{
										// Check xem trước đó có xoa / cứu / giác hơi / ròng rọc / xung ko
										bool isXoaTay = false;
										bool isXoaMay = false;
										bool isCuu = false;
										bool isGiacHoi = false;
										bool isRongRoc = false;
										bool isXung = false;
										int tempKXoaTay = i - 10 <= 0 ? 0 : i - 10;
										int tempKXoaMay = i - 7 <= 0 ? 0 : i - 7;
										int tempKCuu = i - 7 <= 0 ? 0 : i - 7;
										int tempKRongRoc = i - 7 <= 0 ? 0 : i - 7;
										int tempKXung = i - 7 <= 0 ? 0 : i - 7;
										int tempKGiacHoi = i - 4 <= 0 ? 0 : i - 4;

										for (int k = tempKXoaTay; k < i; k++)
										{
											if (arrBS[k, j] != null)
											{
												if (arrBS[k, j].Contains("-Xoa Tay"))
												{
													isXoaTay = true;
													break;
												}
												else if ((k >= tempKXoaMay) && arrBS[k, j].Contains("-Xoa Máy"))
												{
													isXoaMay = true;
													break;
												}
												else if ((k >= tempKCuu) && arrBS[k, j].Contains("-Cứu"))
												{
													isCuu = true;
													break;
												}
												else if ((k >= tempKRongRoc) && arrBS[k, j].Contains("-Ròng Rọc"))
												{
													isRongRoc = true;
													break;
												}
												else if ((k >= tempKGiacHoi) && arrBS[k, j].Contains("-Giác Hơi"))
												{
													isGiacHoi = true;
													break;
												}
											}
										}
										if (isXoaTay || isXoaMay || isXung || isCuu || isRongRoc || isGiacHoi)
										{
											continue;
										}

										arrBS[i, j] = tt.Code + "-Bó";
										DateTime timeTemp = (DateTime)tt.ttBo;
										tt.Bo = timeTemp.ToString("HH:mm") + "-" + arrNameBS[0, j];
										goto LoopEndBo;
									}
								}

								LoopGotoNext:
								// Full -> thêm giờ kế tiếp
								DateTime timeTTBo = ttBoTemp.AddMinutes(timeNext);

								if (!"".Equals(tt.ttXoaMay)) tt.ttXoaMay = updateTimeTT(timeTTBo, (DateTime)tt.ttBo, (DateTime)tt.ttXoaMay);
								if (!"".Equals(tt.ttXoaTay)) tt.ttXoaTay = updateTimeTT(timeTTBo, (DateTime)tt.ttBo, (DateTime)tt.ttXoaTay);
								if (!"".Equals(tt.ttCuu)) tt.ttCuu = updateTimeTT(timeTTBo, (DateTime)tt.ttBo, (DateTime)tt.ttCuu);
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(timeTTBo, (DateTime)tt.ttBo, (DateTime)tt.ttGiacHoi);

								tt.ttBo = timeTTBo;
								tt.Bo = timeTTBo.ToString("HH:mm");
							}
						}
						LoopEndBo:
						logs.Add(tt.Name + "\t\t\t" + "Bó-OK");
					}

					// Xoa máy
					if (!"".Equals(tt.ttXoaMay))
					{
						// dòng
						for (int i = 0; i < arrBS.GetLength(0); i++)
						{
							DateTime ttXoaMayTemp = (DateTime)tt.ttXoaMay;

							// Check làm đủ tới trưa không, nếu không chuyển qua đầu giờ chiều
							if ((DateTime.Compare(dateMorningEnd, ttXoaMayTemp) > 0 && DateTime.Compare(dateMorningEnd, ttXoaMayTemp.AddMinutes(timeXoamay)) < 0) ||
								(DateTime.Compare(dateMorningEnd, ttXoaMayTemp) <= 0 && DateTime.Compare(datAfternoonStart, ttXoaMayTemp) > 0))
							{
								if (!"".Equals(tt.ttXoaTay)) tt.ttXoaTay = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXoaMay, (DateTime)tt.ttXoaTay);
								if (!"".Equals(tt.ttCuu)) tt.ttCuu = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXoaMay, (DateTime)tt.ttCuu);
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXoaMay, (DateTime)tt.ttGiacHoi);

								tt.ttXoaMay = datAfternoonStart;
								tt.XoaMay = datAfternoonStart.ToString("HH:mm");
								continue;
							}
							else
							{
								ttXoaMayTemp = (DateTime)tt.ttXoaMay;
							}

							// Check làm đủ tới tối không, nếu không sẽ log -> có thể tối ưu bước này
							if (DateTime.Compare(datAfternoonEnd, ttXoaMayTemp.AddMinutes(timeXoamay)) < 0)
							{
								Console.WriteLine("\nThủ thuật này ko đủ giờ làm");
								tt.XoaMay = "x";
								goto LoopEndXoaMay;
							}
							else
							{
								ttXoaMayTemp = (DateTime)tt.ttXoaMay;
							}

							if (DateTime.Compare(dateTimes[i], ttXoaMayTemp) == 0)
							{
								// cột
								for (int j = 0; j < arrBS.GetLength(1); j++)
								{

								
									if (!BSs[j].ThuThuat.Contains("XOAMAY"))
									{
										continue;
									}


									if (arrBS[i, j] == null)
									{
										// Check xem trước & sau đó có xoa / cứu / giác hơi / ròng rọc / xung ko
										bool isXoaTay = false;
										bool isXoaMay = false;
										bool isCuu = false;
										bool isGiacHoi = false;
										bool isRongRoc = false;
										bool isXung = false;
										int tempKXoaTay = i - 10 <= 0 ? 0 : i - 10;
										int tempKXoaMay = i - 7 <= 0 ? 0 : i - 7;
										int tempKCuu = i - 7 <= 0 ? 0 : i - 7;
										int tempKRongRoc = i - 7 <= 0 ? 0 : i - 7;
										int tempKXung = i - 7 <= 0 ? 0 : i - 7;
										int tempKGiacHoi = i - 4 <= 0 ? 0 : i - 4;
										int tempIXT = i + 10 >= arrBS.GetLength(0) ? arrBS.GetLength(0) - 1 : i + 10;
										int tempIXM = i + 7 >= arrBS.GetLength(0) ? arrBS.GetLength(0) - 1 : i + 7;

										for (int k = tempKXoaTay; k < i; k++)
										{
											if (arrBS[k, j] != null && arrBS[k, j] != "x")
											{
												if (arrBS[k, j].Contains("-Xoa Tay"))
												{
													isXoaTay = true;
													break;
												}
												else if ((k >= tempKXoaMay) && arrBS[k, j].Contains("-Xoa Máy"))
												{
													isXoaMay = true;
													break;
												}
												else if ((k >= tempKCuu) && arrBS[k, j].Contains("-Cứu"))
												{
													isCuu = true;
													break;
												}
												else if ((k >= tempKRongRoc) && arrBS[k, j].Contains("-Ròng Rọc"))
												{
													isRongRoc = true;
													break;
												}
												else if ((k >= tempKGiacHoi) && arrBS[k, j].Contains("-Giác Hơi"))
												{
													isGiacHoi = true;
													break;
												}
											}
										}

										// Kiểm tra đủ time xoa máy ko
										for (int k = i; k <= tempIXM; k++)
										{
											if (arrBS[k, j] != null && arrBS[k, j] != "x")
											{
												isXoaMay = true;
												break;
											}
										}
										if (isXoaTay || isXoaMay || isXung || isCuu || isRongRoc || isGiacHoi)
										{
											continue;
										}

										arrBS[i, j] = tt.Code + "-Xoa Máy";
										DateTime timeTemp = (DateTime)tt.ttXoaMay;
										tt.XoaMay = timeTemp.ToString("HH:mm") + "-" + arrNameBS[0, j];
										goto LoopEndXoaMay;
									}
								}

								// Full -> thêm giờ kế tiếp
								DateTime timeTTXoaMay = ttXoaMayTemp.AddMinutes(timeNext);

								if (!"".Equals(tt.ttXoaTay)) tt.ttXoaTay = updateTimeTT(timeTTXoaMay, (DateTime)tt.ttXoaMay, (DateTime)tt.ttXoaTay);
								if (!"".Equals(tt.ttCuu)) tt.ttCuu = updateTimeTT(timeTTXoaMay, (DateTime)tt.ttXoaMay, (DateTime)tt.ttCuu);
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(timeTTXoaMay, (DateTime)tt.ttXoaMay, (DateTime)tt.ttGiacHoi);

								tt.ttXoaMay = timeTTXoaMay;
								tt.XoaMay = timeTTXoaMay.ToString("HH:mm");
							}
						}
						LoopEndXoaMay:
						logs.Add(tt.Name + "\t\t\t" + "Xoa máy-OK");
					}

					// Xoa tay
					if (!"".Equals(tt.ttXoaTay))
					{
						// dòng
						for (int i = 0; i < arrBS.GetLength(0); i++)
						{
							DateTime ttXoaTayTemp = (DateTime)tt.ttXoaTay;

							// Check làm đủ tới trưa không, nếu không chuyển qua đầu giờ chiều
							if ((DateTime.Compare(dateMorningEnd, ttXoaTayTemp) > 0 && DateTime.Compare(dateMorningEnd, ttXoaTayTemp.AddMinutes(timeXoatay)) < 0) ||
								(DateTime.Compare(dateMorningEnd, ttXoaTayTemp) <= 0 && DateTime.Compare(datAfternoonStart, ttXoaTayTemp) > 0))
							{
								if (!"".Equals(tt.ttCuu)) tt.ttCuu = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXoaTay, (DateTime)tt.ttCuu);
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(datAfternoonStart, (DateTime)tt.ttXoaTay, (DateTime)tt.ttGiacHoi);

								tt.ttXoaTay = datAfternoonStart;
								tt.XoaTay = datAfternoonStart.ToString("HH:mm");
								continue;
							}
							else
							{
								ttXoaTayTemp = (DateTime)tt.ttXoaTay;
							}

							// Check làm đủ tới tối không, nếu không sẽ log -> có thể tối ưu bước này
							if (DateTime.Compare(datAfternoonEnd, ttXoaTayTemp.AddMinutes(timeXoatay)) < 0)
							{
								Console.WriteLine("\nThủ thuật này ko đủ giờ làm");
								tt.XoaTay = "x";
								goto LoopEndXoaTay;
							}
							else
							{
								ttXoaTayTemp = (DateTime)tt.ttXoaTay;
							}

							if (DateTime.Compare(dateTimes[i], ttXoaTayTemp) == 0)
							{
								// cột
								for (int j = 0; j < arrBS.GetLength(1); j++)
								{

								
									if (!BSs[j].ThuThuat.Contains("XOATAY"))
									{
										continue;
									}

									if (arrBS[i, j] == null)
									{
										// Check xem trước & sau đó có xoa / cứu / giác hơi / ròng rọc / xung ko
										bool isXoaTay = false;
										bool isXoaMay = false;
										bool isCuu = false;
										bool isGiacHoi = false;
										bool isRongRoc = false;
										bool isXung = false;
										int tempKXoaTay = i - 10 <= 0 ? 0 : i - 10;
										int tempKXoaMay = i - 7 <= 0 ? 0 : i - 7;
										int tempKCuu = i - 7 <= 0 ? 0 : i - 7;
										int tempKRongRoc = i - 7 <= 0 ? 0 : i - 7;
										int tempKXung = i - 7 <= 0 ? 0 : i - 7;
										int tempKGiacHoi = i - 4 <= 0 ? 0 : i - 4;
										int tempIXT = i + 10 >= arrBS.GetLength(0) ? arrBS.GetLength(0) - 1 : i + 10;
										int tempIXM = i + 7 >= arrBS.GetLength(0) ? arrBS.GetLength(0) - 1 : i + 7;

										for (int k = tempKXoaTay; k < i; k++)
										{
											if (arrBS[k, j] != null && arrBS[k, j] != "x")
											{
												if (arrBS[k, j].Contains("-Xoa Tay"))
												{
													isXoaTay = true;
													break;
												}
												else if ((k >= tempKXoaMay) && arrBS[k, j].Contains("-Xoa Máy"))
												{
													isXoaMay = true;
													break;
												}
												else if ((k >= tempKCuu) && arrBS[k, j].Contains("-Cứu"))
												{
													isCuu = true;
													break;
												}
												else if ((k >= tempKRongRoc) && arrBS[k, j].Contains("-Ròng Rọc"))
												{
													isRongRoc = true;
													break;
												}
												else if ((k >= tempKGiacHoi) && arrBS[k, j].Contains("-Giác Hơi"))
												{
													isGiacHoi = true;
													break;
												}
											}
										}

										// Kiểm tra đủ time xoa máy ko
										for (int k = i; k <= tempIXT; k++)
										{
											if (arrBS[k, j] != null && arrBS[k, j] != "x")
											{
												isXoaTay = true;
												break;
											}
										}
										if (isXoaTay || isXoaMay || isXung || isCuu || isRongRoc || isGiacHoi)
										{
											continue;
										}

										arrBS[i, j] = tt.Code + "-Xoa Tay";
										DateTime timeTemp = (DateTime)tt.ttXoaTay;
										tt.XoaTay = timeTemp.ToString("HH:mm") + "-" + arrNameBS[0, j];
										goto LoopEndXoaTay;
									}
								}

								// Full -> thêm giờ kế tiếp
								DateTime timeTTXoaTay = ttXoaTayTemp.AddMinutes(timeNext);
								if (!"".Equals(tt.ttCuu)) tt.ttCuu = updateTimeTT(timeTTXoaTay, (DateTime)tt.ttXoaTay, (DateTime)tt.ttCuu);
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(timeTTXoaTay, (DateTime)tt.ttXoaTay, (DateTime)tt.ttGiacHoi);

								tt.ttXoaTay = timeTTXoaTay;
								tt.XoaTay = timeTTXoaTay.ToString("HH:mm");
							}
						}
						LoopEndXoaTay:
						logs.Add(tt.Name + "\t\t\t" + "Xoa tay-OK");
					}

					// Cứu
					if (!"".Equals(tt.ttCuu))
					{
						// dòng
						for (int i = 0; i < arrBS.GetLength(0); i++)
						{
							DateTime ttCuuTemp = (DateTime)tt.ttCuu;

							// Check làm đủ tới trưa không, nếu không chuyển qua đầu giờ chiều
							if ((DateTime.Compare(dateMorningEnd, ttCuuTemp) > 0 && DateTime.Compare(dateMorningEnd, ttCuuTemp.AddMinutes(timeCuu)) < 0) ||
								(DateTime.Compare(dateMorningEnd, ttCuuTemp) <= 0 && DateTime.Compare(datAfternoonStart, ttCuuTemp) > 0))
							{
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(datAfternoonStart, (DateTime)tt.ttCuu, (DateTime)tt.ttGiacHoi);

								tt.ttCuu = datAfternoonStart;
								tt.Cuu = datAfternoonStart.ToString("HH:mm");
								continue;
							}
							else
							{
								ttCuuTemp = (DateTime)tt.ttCuu;
							}

							// Check làm đủ tới tối không, nếu không sẽ log -> có thể tối ưu bước này
							if (DateTime.Compare(datAfternoonEnd, ttCuuTemp.AddMinutes(timeCuu)) < 0)
							{
								Console.WriteLine("\nThủ thuật này ko đủ giờ làm");
								tt.Cuu = "x";
								goto LoopEndCuu;
							}
							else
							{
								ttCuuTemp = (DateTime)tt.ttCuu;
							}

							if (DateTime.Compare(dateTimes[i], ttCuuTemp) == 0)
							{
								// cột
								for (int j = 0; j < arrBS.GetLength(1); j++)
								{
									if (!BSs[j].ThuThuat.Contains("CUU"))
									{
										continue;
									}

									if (arrBS[i, j] == null)
									{
										// Check xem trước đó có xoa / cứu / giác hơi / ròng rọc / xung ko
										bool isXoaTay = false;
										bool isXoaMay = false;
										bool isCuu = false;
										bool isGiacHoi = false;
										bool isRongRoc = false;
										bool isXung = false;
										int tempKXoaTay = i - 10 <= 0 ? 0 : i - 10;
										int tempKXoaMay = i - 7 <= 0 ? 0 : i - 7;
										int tempKCuu = i - 7 <= 0 ? 0 : i - 7;
										int tempKRongRoc = i - 7 <= 0 ? 0 : i - 7;
										int tempKXung = i - 7 <= 0 ? 0 : i - 7;
										int tempKGiacHoi = i - 4 <= 0 ? 0 : i - 4;
										int tempICuu = i + 7 >= arrBS.GetLength(0) ? arrBS.GetLength(0) - 1 : i + 7;

										for (int k = tempKXoaTay; k < i; k++)
										{
											if (arrBS[k, j] != null && arrBS[k, j] != "x")
											{
												if (arrBS[k, j].Contains("-Xoa Tay"))
												{
													isXoaTay = true;
													break;
												}
												else if ((k >= tempKXoaMay) && arrBS[k, j].Contains("-Xoa Máy"))
												{
													isXoaMay = true;
													break;
												}
												else if ((k >= tempKCuu) && arrBS[k, j].Contains("-Cứu"))
												{
													isCuu = true;
													break;
												}
												else if ((k >= tempKRongRoc) && arrBS[k, j].Contains("-Ròng Rọc"))
												{
													isRongRoc = true;
													break;
												}
												else if ((k >= tempKGiacHoi) && arrBS[k, j].Contains("-Giác Hơi"))
												{
													isGiacHoi = true;
													break;
												}
											}
										}
										for (int k = i; k <= tempICuu; k++)
										{
											if (arrBS[k, j] != null && arrBS[k, j] != "x")
											{
												isCuu = true;
												break;
											}
										}
										if (isXoaTay || isXoaMay || isXung || isCuu || isRongRoc || isGiacHoi)
										{
											continue;
										}

										arrBS[i, j] = tt.Code + "-Cứu";
										DateTime timeTemp = (DateTime)tt.ttCuu;
										tt.Cuu = timeTemp.ToString("HH:mm") + "-" + arrNameBS[0, j];
										goto LoopEndCuu;
									}
								}

								// Full -> thêm giờ kế tiếp
								DateTime timeTTCuu = ttCuuTemp.AddMinutes(timeNext);
								if (!"".Equals(tt.ttGiacHoi)) tt.ttGiacHoi = updateTimeTT(timeTTCuu, (DateTime)tt.ttCuu, (DateTime)tt.ttGiacHoi);

								tt.ttCuu = timeTTCuu;
								tt.Cuu = timeTTCuu.ToString("HH:mm");
							}
						}
					LoopEndCuu:
						logs.Add(tt.Name + "\t\t\t" + "Cứu-OK");
					}

					// Giác Hơi
					if (!"".Equals(tt.ttGiacHoi))
					{
						// dòng
						for (int i = 0; i < arrBS.GetLength(0); i++)
						{
							DateTime ttGiacHoiTemp = (DateTime)tt.ttGiacHoi;

							// Check làm đủ tới trưa không, nếu không chuyển qua đầu giờ chiều
							if ((DateTime.Compare(dateMorningEnd, ttGiacHoiTemp) > 0 && DateTime.Compare(dateMorningEnd, ttGiacHoiTemp.AddMinutes(timeGiacHoi)) < 0) ||
								(DateTime.Compare(dateMorningEnd, ttGiacHoiTemp) <= 0 && DateTime.Compare(datAfternoonStart, ttGiacHoiTemp) > 0))
							{
								tt.ttGiacHoi = datAfternoonStart;
								tt.GiacHoi = datAfternoonStart.ToString("HH:mm");
								continue;
							}
							else
							{
								ttGiacHoiTemp = (DateTime)tt.ttGiacHoi;
							}

							// Check làm đủ tới tối không, nếu không sẽ log -> có thể tối ưu bước này
							if (DateTime.Compare(datAfternoonEnd, ttGiacHoiTemp.AddMinutes(timeGiacHoi)) < 0)
							{
								Console.WriteLine("\nThủ thuật này ko đủ giờ làm");
								tt.GiacHoi = "x";
								goto LoopEndGiacHoi;
							}
							else
							{
								ttGiacHoiTemp = (DateTime)tt.ttGiacHoi;
							}

							if (DateTime.Compare(dateTimes[i], ttGiacHoiTemp) == 0)
							{
								// cột
								for (int j = 0; j < arrBS.GetLength(1); j++)
								{

									if (!BSs[j].ThuThuat.Contains("GIACHOI"))
									{
										continue;
									}

									if (arrBS[i, j] == null)
									{
										// Check xem trước đó có xoa / cứu / giác hơi / ròng rọc / xung ko
										bool isXoaTay = false;
										bool isXoaMay = false;
										bool isCuu = false;
										bool isGiacHoi = false;
										bool isRongRoc = false;
										bool isXung = false;
										int tempKXoaTay = i - 10 <= 0 ? 0 : i - 10;
										int tempKXoaMay = i - 7 <= 0 ? 0 : i - 7;
										int tempKCuu = i - 7 <= 0 ? 0 : i - 7;
										int tempKRongRoc = i - 7 <= 0 ? 0 : i - 7;
										int tempKXung = i - 7 <= 0 ? 0 : i - 7;
										int tempKGiacHoi = i - 4 <= 0 ? 0 : i - 4;
										int tempIGiacHoi = i + 4 >= arrBS.GetLength(0) ? arrBS.GetLength(0) - 1 : i + 4;

										for (int k = tempKXoaTay; k < i; k++)
										{
											if (arrBS[k, j] != null && arrBS[k, j] != "x")
											{
												if (arrBS[k, j].Contains("-Xoa Tay"))
												{
													isXoaTay = true;
													break;
												}
												else if ((k >= tempKXoaMay) && arrBS[k, j].Contains("-Xoa Máy"))
												{
													isXoaMay = true;
													break;
												}
												else if ((k >= tempKCuu) && arrBS[k, j].Contains("-Cứu"))
												{
													isCuu = true;
													break;
												}
												else if ((k >= tempKRongRoc) && arrBS[k, j].Contains("-Ròng Rọc"))
												{
													isRongRoc = true;
													break;
												}
												else if ((k >= tempKGiacHoi) && arrBS[k, j].Contains("-Giác Hơi"))
												{
													isGiacHoi = true;
													break;
												}
											}
										}
										for (int k = i; k <= tempIGiacHoi; k++)
										{
											if (arrBS[k, j] != null && arrBS[k, j] != "x")
											{
												isGiacHoi = true;
												break;
											}
										}
										if (isXoaTay || isXoaMay || isXung || isCuu || isRongRoc || isGiacHoi)
										{
											continue;
										}

										arrBS[i, j] = tt.Code + "-Giác Hơi";
										DateTime timeTemp = (DateTime)tt.ttGiacHoi;
										tt.GiacHoi = timeTemp.ToString("HH:mm") + "-" + arrNameBS[0, j];
										goto LoopEndGiacHoi;
									}
								}

								// Full -> thêm giờ kế tiếp
								DateTime timeTTGiacHoi = ttGiacHoiTemp.AddMinutes(timeNext);
								tt.ttGiacHoi = timeTTGiacHoi;
								tt.GiacHoi = timeTTGiacHoi.ToString("HH:mm");
							}
						}
					LoopEndGiacHoi:
						logs.Add(tt.Name + "\t\t\t" + "Giác Hơi-OK");
					}

					bool IsSave = excelChiaTTDataService.ManageExcelTT(tt).Result;
				}


				logs.Add("---------End Chia thủ thuật - Khám bình thường ----------");

				

				List<string> nameLst = new List<string>();
				for (int j = 0; j < arrNameBS.GetLength(1); j++)
				{
					nameLst.Add(arrNameBS[0, j]);
				}

				for (int i = 0; i < arrBS.GetLength(0); i++)
				{
					string STT = (i + 1).ToString();
					List<string> dataLst = new List<string>();
					string line = "";
					line += dateTimes[i].ToString("HH:mm") + "\t";
					for (int j = 0; j < arrBS.GetLength(1); j++)
					{
						String thuThuat = arrBS[i, j] != null ? arrBS[i, j] : "";
						line += thuThuat + "\t";
						string value = "";
						if (arrBS[i, j] != null && arrBS[i, j] != "x")
						{
							value = arrBS[i, j];
						}
						dataLst.Add(value);
					}
					bool IsSave = excelChiaTTDataService.ManageExcelPrintTT(STT, dataLst, nameLst).Result;
					//logs.Add(line);
				}
				logs.Add("---------End Tạo data Auto Thủ thuật ----------");


				foreach (string log in logs.ToArray())
				{
					await file.WriteLineAsync(log);
				}

				MessageBox.Show("ƪ(˘⌣˘)ʃ chia thủ thuật xong rồi nà...");
			}
			catch (Exception ex)
			{
				
				MessageBox.Show("Lỗi -> " + ex);

				logs.Add(ex.Message);

				foreach (string log in logs.ToArray())
				{
					await file.WriteLineAsync(log);
				}
			}
		}

		static string GetKTVName(string maKTV)
		{
			// Tạo từ điển lưu trữ Mã KTV và Tên KTV
			Dictionary<string, string> ktvDictionary = new Dictionary<string, string>
		{
			{ "THUONG", "THUONGNTN" },
			{ "QUYNH", "QUYNHLT" },
			{ "DUNG", "DUNGTTN" },
			{ "UYEN", "UYENHT" },
			{ "CHAU", "CHAUNTB" },
			{ "NGOC", "NGOCLTN" },
			{ "ANHTHU", "THUNTA" }
		};

			// Kiểm tra xem mã KTV có tồn tại trong từ điển không
			if (ktvDictionary.TryGetValue(maKTV, out string tenKTV))
			{
				return tenKTV;
			}
			else
			{
				return maKTV; 
			}
		}

		
	public DateTime updateTimeTT(DateTime x, DateTime y, DateTime z)
		{
			z = z.AddMinutes(Math.Abs((x - y).TotalMinutes));
			return z;
		}

	}

}
